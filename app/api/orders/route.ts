import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { DELIVERY_RANGE_KM, MINIMUM_DELIVERY_QUANTITY, MINIMUM_DELIVERY_TOTAL, isScheduleValid } from '@/lib/delivery'
import { quoteDelivery } from '@/lib/geocode'
import { sendOrderReceipt } from '@/lib/email/send-receipt'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAYMENT_PROOF_BUCKET, PAYMENT_PROOF_MAX_BYTES } from '@/lib/payment'
import { safeImageExtension, serverError } from '@/lib/api'
import { clientIp, underRateLimit } from '@/lib/rate-limit'
import { mapOrderRow, type OrderRow } from '@/lib/orders'

// The browser only says what it wants and how many. Prices, the total and
// stock are settled by create_order() in the database
// (supabase/migrations/0014_create_order_function.sql).
const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(1000),
      })
    )
    .min(1)
    .max(100),
  // The total the customer was shown. If prices changed since, the order is
  // refused rather than charged a different amount.
  expectedTotal: z.number().nonnegative(),
  customerName: z.string().trim().max(100),
  customerEmail: z.string().trim().max(254),
  customerPhone: z.string().trim().max(30),
  address: z.string().trim().max(500),
  deliveryType: z.enum(['delivery', 'pickup']),
  paymentMethod: z.enum(['cash', 'gcash']),
  deliveryDate: z.string().optional(),
  deliverySession: z.string().optional(),
  walkIn: z.boolean().optional(),
})

// create_order() raises these by name; anything else is unexpected.
const ORDER_ERRORS: Record<string, (detail?: string) => string> = {
  OUT_OF_STOCK: name =>
    `Sorry, we don't have enough ${name ?? 'of one item'} left. Please lower the quantity and try again.`,
  PRICE_CHANGED: () =>
    'Some prices changed while you were shopping. Please check your updated total and place the order again.',
  PRODUCT_NOT_FOUND: () =>
    'An item in your cart is no longer available. Please remove it and try again.',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Ordering requires an account, so every order is tied to a customer.
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to place an order.' }, { status: 401 })
    }

    // GCash orders arrive as multipart so the payment screenshot can ride along
    // with the order; everything else (POS, cash) is plain JSON.
    let body: unknown
    let paymentProof: File | null = null
    try {
      if (req.headers.get('content-type')?.includes('multipart/form-data')) {
        const form = await req.formData()
        body = JSON.parse(String(form.get('order') ?? '{}'))
        const file = form.get('paymentProof')
        paymentProof = file instanceof File && file.size > 0 ? file : null
      } else {
        body = await req.json()
      }
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Some order details are missing or invalid. Please check your cart and try again.' },
        { status: 400 }
      )
    }
    const {
      items,
      expectedTotal,
      customerName,
      customerEmail,
      customerPhone,
      address,
      deliveryType,
      paymentMethod,
      deliveryDate,
      deliverySession,
    } = parsed.data

    // POS walk-in sales are recorded already `completed`, skip scheduling and
    // the payment screenshot, and email a receipt — so only staff may make one.
    const isWalkIn = parsed.data.walkIn === true
    if (isWalkIn) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Only staff can record walk-in sales.' }, { status: 403 })
      }
    }

    if (!isWalkIn) {
      // Each attempt can upload a screenshot and query the geocoder.
      if (!(await underRateLimit(`order:${clientIp(req)}`, 10, 10 * 60))) {
        return NextResponse.json(
          { error: 'Too many order attempts. Please wait a few minutes and try again.' },
          { status: 429 }
        )
      }

      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      if (deliveryType === 'delivery' && totalQuantity < MINIMUM_DELIVERY_QUANTITY) {
        return NextResponse.json(
          { error: `Delivery orders need at least ${MINIMUM_DELIVERY_QUANTITY} items. Add more items or choose pick-up.` },
          { status: 400 }
        )
      }
      // expectedTotal is safe to check here: create_order() refuses the order
      // if it doesn't match the real prices.
      if (deliveryType === 'delivery' && expectedTotal < MINIMUM_DELIVERY_TOTAL) {
        return NextResponse.json(
          { error: `Delivery orders must be at least ₱${MINIMUM_DELIVERY_TOTAL}. Add more items or choose pick-up.` },
          { status: 400 }
        )
      }
      if (!customerName || !customerPhone || !z.string().email().safeParse(customerEmail).success) {
        return NextResponse.json(
          { error: 'Please enter your name, a valid email and your phone number.' },
          { status: 400 }
        )
      }
      if (deliveryType === 'delivery' && !address) {
        return NextResponse.json({ error: 'Please enter your delivery address.' }, { status: 400 })
      }
    }

    // POS walk-in sales are fulfilled on the spot, so they carry no schedule.
    // Every other order must have one.
    if (!isWalkIn && !isScheduleValid(deliveryDate, deliverySession)) {
      return NextResponse.json(
        { error: 'Please choose a delivery date and time that is still available.' },
        { status: 400 }
      )
    }

    // Never trust the client's distance — re-derive it from the address so the
    // delivery radius cannot be bypassed by a crafted request.
    let serverDistance: number | null = null
    if (deliveryType === 'delivery') {
      let quote
      try {
        quote = await quoteDelivery(address ?? '')
      } catch (error) {
        console.error('[orders] address check failed:', error)
        return NextResponse.json(
          { error: "We couldn't verify that address right now. Please try again." },
          { status: 502 }
        )
      }
      if (!quote.found) {
        return NextResponse.json(
          { error: 'We could not find that delivery address.' },
          { status: 400 }
        )
      }
      if (!quote.withinRange) {
        return NextResponse.json(
          {
            error: `That address is ${quote.distanceKm.toFixed(1)}km away, beyond our ${DELIVERY_RANGE_KM}km delivery range.`,
          },
          { status: 400 }
        )
      }
      serverDistance = quote.distanceKm
    }

    // Online GCash/InstaPay orders must show they've paid. Walk-ins pay at the
    // counter, so the POS never sends one.
    let paymentProofPath: string | null = null
    if (paymentMethod === 'gcash' && !isWalkIn) {
      if (!paymentProof) {
        return NextResponse.json(
          { error: 'Please upload a screenshot of your GCash/InstaPay payment.' },
          { status: 400 }
        )
      }
      if (!paymentProof.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Payment proof must be an image.' }, { status: 400 })
      }
      if (paymentProof.size > PAYMENT_PROOF_MAX_BYTES) {
        return NextResponse.json(
          { error: 'Payment screenshot must be smaller than 5MB.' },
          { status: 400 }
        )
      }

      paymentProofPath = `${crypto.randomUUID()}.${safeImageExtension(paymentProof)}`
      const { error: uploadError } = await createAdminClient()
        .storage.from(PAYMENT_PROOF_BUCKET)
        .upload(paymentProofPath, Buffer.from(await paymentProof.arrayBuffer()), {
          contentType: paymentProof.type,
        })
      if (uploadError) {
        return NextResponse.json(
          { error: "We couldn't upload your payment screenshot. Please try again." },
          { status: 500 }
        )
      }
    }

    // One transaction: price lookup, stock check and decrement, order, items
    // and inventory log. user_id is null for walk-ins, which belong to the
    // customer at the counter rather than the admin ringing them up.
    const { data: order, error: orderError } = await createAdminClient().rpc('create_order', {
      p_items: items.map(item => ({ product_id: item.productId, quantity: item.quantity })),
      p_user_id: isWalkIn ? null : user.id,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_address: address,
      p_delivery_type: deliveryType,
      p_distance: serverDistance,
      p_delivery_date: isWalkIn ? null : deliveryDate,
      p_delivery_session: isWalkIn ? null : deliverySession,
      p_payment_method: paymentMethod,
      p_payment_proof: paymentProofPath,
      p_status: isWalkIn ? 'completed' : 'pending',
      p_expected_total: Math.round(expectedTotal * 100) / 100,
    })

    if (orderError || !order) {
      // Don't leave an orphaned screenshot behind for an order that never existed.
      if (paymentProofPath) {
        await createAdminClient().storage.from(PAYMENT_PROOF_BUCKET).remove([paymentProofPath])
      }
      const explain = orderError && ORDER_ERRORS[orderError.message]
      if (explain) {
        return NextResponse.json(
          { error: explain(orderError.details || undefined), code: orderError.message },
          { status: 409 }
        )
      }
      throw orderError ?? new Error('create_order returned no order')
    }

    // POS sales never pass through the admin status route, so their receipt is
    // triggered here instead.
    if (order.status === 'completed') {
      after(() => sendOrderReceipt(order.id))
    }

    return NextResponse.json({ order: mapOrderRow(order as OrderRow) })
  } catch (error) {
    return serverError('orders', error, "We couldn't place your order. Please try again.")
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's orders
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const orders = ((data ?? []) as OrderRow[]).map(mapOrderRow)

    return NextResponse.json({ orders })
  } catch (error) {
    return serverError('orders', error, "Couldn't load your orders.")
  }
}
