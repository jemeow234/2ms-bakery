import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, serverError } from '@/lib/api'

// The fields an admin may edit. Email and id belong to Supabase Auth.
const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  role: z.enum(['user', 'admin']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response
    const { supabase, user } = admin

    const parsed = updateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check the name, phone and role.' }, { status: 400 })
    }

    // Demoting yourself could leave the shop with no admin at all.
    if (id === user.id && parsed.data.role === 'user') {
      return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ user: data })
  } catch (error) {
    return serverError('admin/users', error, "Couldn't update the user. Please try again.")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response
    const { supabase, user } = admin

    if (id === user.id) {
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
    }

    // Deleting only the profile row isn't enough: the login survives and the
    // profile is recreated on the next sign-in. Removing the Auth user
    // cascades to the profile; their orders stay, unlinked from the account.
    const { error: authError } = await createAdminClient().auth.admin.deleteUser(id)

    if (authError && authError.status !== 404) throw authError

    // No Auth user (already gone) — clear any profile row left behind.
    if (authError) {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('admin/users', error, "Couldn't delete the user. Please try again.")
  }
}
