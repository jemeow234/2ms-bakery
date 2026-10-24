import { NextResponse } from 'next/server'
import { requireAdmin, serverError } from '@/lib/api'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { data, error } = await admin.supabase
      .from('special_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ specialOrders: data })
  } catch (error) {
    return serverError('admin/special-orders', error, "Couldn't load special orders.")
  }
}
