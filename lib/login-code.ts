// Server-only. The emailed sign-in code that every new login session must
// enter (supabase/migrations/0026_login_verification.sql).

import { createHash, randomInt } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export const LOGIN_CODE_LENGTH = 6
export const LOGIN_CODE_TTL_MINUTES = 10
export const LOGIN_CODE_RESEND_SECONDS = 60

export function generateLoginCode(): string {
  return randomInt(0, 10 ** LOGIN_CODE_LENGTH).toString().padStart(LOGIN_CODE_LENGTH, '0')
}

// Salted with the session id so a code is only good for the session it was
// sent to.
export function hashLoginCode(sessionId: string, code: string): string {
  return createHash('sha256').update(`${sessionId}:${code}`).digest('hex')
}

export interface PendingSession {
  sessionId: string
  userId: string
  email: string
}

/** The caller's verified-by-Supabase session, whether or not its code is in. */
export async function currentSession(): Promise<PendingSession | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const sessionId = typeof claims?.session_id === 'string' ? claims.session_id : null
  const email = typeof claims?.email === 'string' ? claims.email : null
  if (!claims?.sub || !sessionId || !email) return null
  return { sessionId, userId: claims.sub, email }
}
