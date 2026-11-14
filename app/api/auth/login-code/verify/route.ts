import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { serverError } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'
import { currentSession, hashLoginCode, LOGIN_CODE_LENGTH } from '@/lib/login-code'

const bodySchema = z.object({
  code: z.string().trim().regex(new RegExp(`^\\d{${LOGIN_CODE_LENGTH}}$`)),
})

const MESSAGES: Record<string, string> = {
  NO_CODE: 'No code has been sent for this sign-in. Please request a new one.',
  EXPIRED: 'That code has expired. Please request a new one.',
  TOO_MANY_ATTEMPTS: 'Too many wrong attempts. Please request a new code.',
  WRONG_CODE: "That code isn't right. Please check your email and try again.",
}

export async function POST(req: NextRequest) {
  try {
    const session = await currentSession()
    if (!session) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: `Enter the ${LOGIN_CODE_LENGTH}-digit code from your email.` }, { status: 400 })
    }

    const { data: result, error } = await createAdminClient().rpc('check_login_code', {
      p_session_id: session.sessionId,
      p_user_id: session.userId,
      p_code_hash: hashLoginCode(session.sessionId, parsed.data.code),
    })
    if (error) throw error

    if (result !== 'OK') {
      return NextResponse.json(
        { error: MESSAGES[result as string] ?? 'Verification failed.', reason: result },
        { status: 400 }
      )
    }

    return NextResponse.json({ verified: true })
  } catch (error) {
    return serverError('login-code/verify', error, "We couldn't check your code. Please try again.")
  }
}
