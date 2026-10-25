import { NextResponse } from 'next/server'
import { requireAdmin, serverError } from '@/lib/api'

type Embedded<T> = T | T[] | null

const one = <T,>(value: Embedded<T>): T | null =>
  Array.isArray(value) ? value[0] ?? null : value

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    // RLS lets admins read every customer's feedback.
    const { data, error } = await admin.supabase
      .from('order_feedback')
      .select('id, order_id, user_id, rating, comment, created_at, users(name, email), orders(customer_name, total)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const feedback = (data ?? []).map(row => {
      const customer = one(row.users as Embedded<{ name: string; email: string }>)
      const order = one(row.orders as Embedded<{ customer_name: string | null; total: number }>)
      return {
        id: row.id,
        orderId: row.order_id,
        userId: row.user_id,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at,
        customerName: customer?.name || order?.customer_name || '',
        customerEmail: customer?.email || '',
        orderTotal: order ? Number(order.total) : null,
      }
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    return serverError('admin/feedback', error, "Couldn't load feedback.")
  }
}
