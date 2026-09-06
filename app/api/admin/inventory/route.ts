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
      .from('inventory_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const logs = (data || []).map((log: any) => ({
      id: log.id,
      productId: log.product_id,
      productName: log.product_name,
      type: log.type,
      quantity: log.quantity,
      previousStock: log.previous_stock,
      newStock: log.new_stock,
      note: log.note ?? undefined,
      createdAt: log.created_at,
    }))

    return NextResponse.json({ logs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { productId, quantity, type, note } = body

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single()

    if (productError) throw productError

    const previousStock = product.stock
    let newStock: number
    if (type === 'add') {
      newStock = previousStock + quantity
    } else if (type === 'remove') {
      newStock = Math.max(0, previousStock - quantity)
    } else {
      // adjustment — quantity is the exact new stock amount
      newStock = quantity
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) throw updateError

    const { error: logError } = await supabase
      .from('inventory_logs')
      .insert({
        product_id: productId,
        product_name: updatedProduct.name,
        type,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        note: note || null,
      })

    if (logError) throw logError

    return NextResponse.json({ product: updatedProduct })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
