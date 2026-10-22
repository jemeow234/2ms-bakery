import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, serverError } from '@/lib/api'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { error } = await admin.supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('admin/announcements', error, "Couldn't delete the announcement.")
  }
}
