import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverError } from '@/lib/api'
import { clientIp, underRateLimit } from '@/lib/rate-limit'

const ALREADY_PREPARING =
  'This order is already being prepared and can no longer be cancelled here. Please contact us to change it.'

// A customer cancelling their own order. Only pending orders qualify — once
// the bakery starts on it, changes go through the shop.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to cancel an order.' }, { status: 401 })
    }

    if (!(await underRateLimit(`cancel:${clientIp(req)}`, 10, 10 * 60))) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 }
      )
    }

    // Read with the customer's own session, so only their orders are found.
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ error: ALREADY_PREPARING }, { status: 409 })
    }

    // set_order_status() locks the order and puts its stock back in one
    // transaction (supabase/migrations/0016_order_status_and_walk_ins.sql).
    // An admin moving it to processing in the instant between the check
    // above and this call would still be overridden — rare enough to accept.
    const { data, error: cancelError } = await createAdminClient().rpc('set_order_status', {
      p_order_id: id,
      p_status: 'cancelled',
    })

    if (cancelError?.message === 'ORDER_CLOSED') {
      return NextResponse.json({ error: ALREADY_PREPARING }, { status: 409 })
    }
    if (cancelError) throw cancelError

    return NextResponse.json({ order: { id, status: data?.status ?? 'cancelled' } })
  } catch (error) {
    return serverError('orders/cancel', error, "Couldn't cancel the order. Please try again.")
  }
}
