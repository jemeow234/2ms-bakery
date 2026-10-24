import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, serverError } from '@/lib/api'

const statusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'completed', 'declined']),
  // The final amount charged, when completing; defaults to the estimate.
  total: z.number().nonnegative().max(10_000_000).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const parsed = statusSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Unknown status.' }, { status: 400 })
    }

    // Completing records the sale in orders, and un-completing removes it, in
    // the same transaction (supabase/migrations/0023_special_orders_count_as_sales.sql).
    const { data, error } = await createAdminClient().rpc('set_special_order_status', {
      p_id: id,
      p_status: parsed.data.status,
      p_total: parsed.data.total ?? null,
    })

    if (error?.message === 'SPECIAL_ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Special order not found.' }, { status: 404 })
    }
    if (error?.message === 'TOTAL_REQUIRED') {
      return NextResponse.json(
        { error: 'Enter the final amount charged to complete this order.' },
        { status: 400 }
      )
    }
    if (error) throw error

    return NextResponse.json({ specialOrder: data })
  } catch (error) {
    return serverError('admin/special-orders', error, "Couldn't update the special order.")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { error } = await admin.supabase
      .from('special_orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('admin/special-orders', error, "Couldn't delete the special order.")
  }
}
