import { NextResponse } from 'next/server'
import { requireAdmin, serverError } from '@/lib/api'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { data, error } = await admin.supabase
      .from('users')
      .select('id, email, name, phone, address, role, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error) {
    return serverError('admin/users', error, "Couldn't load users.")
  }
}
