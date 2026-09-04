import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    }))

    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
