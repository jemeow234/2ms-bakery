import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export interface AdminContext {
  supabase: ServerSupabase
  user: User
  profile: { role: 'admin'; name: string }
}

/**
 * Resolves the signed-in admin for an /api/admin route, or the 401/403
 * response to send instead:
 *
 *   const admin = await requireAdmin()
 *   if ('response' in admin) return admin.response
 */
export async function requireAdmin(): Promise<AdminContext | { response: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, user, profile: { role: 'admin', name: profile.name } }
}

/**
 * Logs the real error for the server logs and answers with a message that is
 * safe to show — database errors name tables, columns and constraints.
 */
export function serverError(
  scope: string,
  error: unknown,
  message = 'Something went wrong. Please try again.'
): NextResponse {
  console.error(`[${scope}]`, error)
  return NextResponse.json({ error: message }, { status: 500 })
}

/** A file extension safe to put in a storage path; falls back to the MIME type. */
export function safeImageExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (/^[a-z0-9]{1,5}$/.test(fromName)) return fromName
  return file.type.split('/')[1]?.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'img'
}
