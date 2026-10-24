import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, serverError } from '@/lib/api'

const statusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'completed', 'declined']),
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

    const { data, error } = await admin.supabase
      .from('special_orders')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Special order not found.' }, { status: 404 })
    }

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
