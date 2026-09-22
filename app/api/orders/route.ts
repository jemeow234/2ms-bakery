import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse, after } from 'next/server'
import { DELIVERY_RANGE_KM, isScheduleValid } from '@/lib/delivery'
import { quoteDelivery } from '@/lib/geocode'
import { sendOrderReceipt } from '@/lib/email/send-receipt'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const {
      items,
      total,
      customerName,
      customerEmail,
      customerPhone,
      address,
      deliveryType,
      paymentMethod,
      status,
      deliveryDate,
      deliverySession,
    } = body

    // POS walk-in sales are created already `completed` and fulfilled on the
    // spot, so they carry no schedule. Every other order must have one.
    const isWalkIn = status === 'completed'
    if (!isWalkIn && !isScheduleValid(deliveryDate, deliverySession)) {
      return NextResponse.json(
        { error: 'Please choose a delivery date and session that is still available.' },
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
      } catch {
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

    // Checkout doesn't require an account — user_id is null for guest orders.
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        address,
        delivery_type: deliveryType,
        distance: serverDistance,
        delivery_date: isWalkIn ? null : deliveryDate,
        delivery_session: isWalkIn ? null : deliverySession,
        total,
        payment_method: paymentMethod,
        status: status || 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Update product stock

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product.id)
        .single()

      if (product) {
        const newStock = product.stock - item.quantity

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id)

        // Log inventory change
        await supabase
          .from('inventory_logs')
          .insert({
            product_id: item.product.id,
            product_name: item.product.name,
            type: 'sale',
            quantity: item.quantity,
            previous_stock: product.stock,
            new_stock: newStock,
            note: `Order #${order.id}`
          })
      }
    }

    // POS sales never pass through the admin status route, so their receipt is
    // triggered here instead.
    if (order.status === 'completed') {
      after(() => sendOrderReceipt(order.id))
    }

    return NextResponse.json({
      order: {
        id: order.id,
        items,
        total: order.total,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        address: order.address,
        deliveryType: order.delivery_type,
        status: order.status,
        createdAt: order.created_at,
        paymentMethod: order.payment_method,
        distance: order.distance ?? undefined,
        deliveryDate: order.delivery_date ?? undefined,
        deliverySession: order.delivery_session ?? undefined,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    const orders = (data || []).map((order: any) => ({
      id: order.id,
      items: (order.order_items || []).map((item: any) => ({
        product: { id: item.product_id, name: item.product_name, price: item.price },
        quantity: item.quantity,
      })),
      total: order.total,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      address: order.address,
      deliveryType: order.delivery_type,
      status: order.status,
      createdAt: order.created_at,
      paymentMethod: order.payment_method,
      distance: order.distance ?? undefined,
      deliveryDate: order.delivery_date ?? undefined,
      deliverySession: order.delivery_session ?? undefined,
    }))

    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
