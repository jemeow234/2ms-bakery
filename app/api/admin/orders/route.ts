import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAYMENT_PROOF_BUCKET } from '@/lib/payment'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      .order('created_at', { ascending: false })

    if (error) throw error

    // The bucket is private, so hand the admin page short-lived links instead.
    const proofPaths = (data || [])
      .map((order: any) => order.payment_proof)
      .filter(Boolean) as string[]
    const proofUrls = new Map<string, string>()
    if (proofPaths.length > 0) {
      const { data: signed } = await createAdminClient()
        .storage.from(PAYMENT_PROOF_BUCKET)
        .createSignedUrls(proofPaths, 60 * 60)
      for (const s of signed || []) {
        if (s.path && s.signedUrl) proofUrls.set(s.path, s.signedUrl)
      }
    }

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
      paymentProofUrl: order.payment_proof ? proofUrls.get(order.payment_proof) : undefined,
    }))

    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
