import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { sendOrderReceipt } from '@/lib/email/send-receipt'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, serverError } from '@/lib/api'

const statusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const parsed = statusSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Unknown order status.' }, { status: 400 })
    }

    // Cancelling puts the order's stock back in the same transaction
    // (supabase/migrations/0016_order_status_and_walk_ins.sql).
    const { data, error } = await createAdminClient().rpc('set_order_status', {
      p_order_id: id,
      p_status: parsed.data.status,
    })

    if (error?.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }
    if (error?.message === 'ORDER_CLOSED') {
      return NextResponse.json(
        { error: 'This order is already completed or cancelled and can no longer change.' },
        { status: 409 }
      )
    }
    if (error) throw error

    // Email the receipt without blocking the admin UI. sendOrderReceipt is
    // idempotent, so a repeated request won't re-send.
    if (data?.status === 'completed') {
      after(() => sendOrderReceipt(id))
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    return serverError('admin/orders', error, "Couldn't update the order. Please try again.")
  }
}
