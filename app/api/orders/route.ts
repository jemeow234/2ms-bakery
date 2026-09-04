import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const { items, total, customerName, customerEmail, customerPhone, address, deliveryType, distance, paymentMethod } = body

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
        distance,
        total,
        payment_method: paymentMethod,
        status: 'pending'
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
    }))

    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
