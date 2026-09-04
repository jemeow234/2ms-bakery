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
