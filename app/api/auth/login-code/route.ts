import { NextRequest, NextResponse } from 'next/server'
import { serverError } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'
import { getReceiptFrom, getResend } from '@/lib/email/client'
import { clientIp, underRateLimit } from '@/lib/rate-limit'
import { SITE_NAME } from '@/lib/site'
import {
  currentSession,
  generateLoginCode,
  hashLoginCode,
  LOGIN_CODE_RESEND_SECONDS,
  LOGIN_CODE_TTL_MINUTES,
} from '@/lib/login-code'

// Emails a sign-in code for the caller's current session. Called right after
// the password step, and again from "Resend code".
export async function POST(req: NextRequest) {
  try {
    const session = await currentSession()
    if (!session) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('login_verifications')
      .select('sent_at, verified_at')
      .eq('session_id', session.sessionId)
      .maybeSingle()

    if (existing?.verified_at) {
      return NextResponse.json({ verified: true })
    }

    const sinceLast = existing ? (Date.now() - new Date(existing.sent_at).getTime()) / 1000 : Infinity
    if (sinceLast < LOGIN_CODE_RESEND_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(LOGIN_CODE_RESEND_SECONDS - sinceLast)}s before requesting another code.` },
        { status: 429 }
      )
    }

    const allowed =
      (await underRateLimit(`login-code:user:${session.userId}`, 10, 3600)) &&
      (await underRateLimit(`login-code:ip:${clientIp(req)}`, 30, 3600))
    if (!allowed) {
      return NextResponse.json({ error: 'Too many codes requested. Please try again later.' }, { status: 429 })
    }

    const resend = getResend()
    const isProduction = process.env.NODE_ENV === 'production'
    if (!resend && isProduction) {
      return serverError('login-code', 'RESEND_API_KEY is not set', "We couldn't send your sign-in code.")
    }

    const code = generateLoginCode()
    const { error: saveError } = await admin.from('login_verifications').upsert({
      session_id: session.sessionId,
      user_id: session.userId,
      code_hash: hashLoginCode(session.sessionId, code),
      expires_at: new Date(Date.now() + LOGIN_CODE_TTL_MINUTES * 60_000).toISOString(),
      attempts: 0,
      sent_at: new Date().toISOString(),
      verified_at: null,
    })
    if (saveError) throw saveError

    if (!resend) {
      // Local development without mail configured.
      console.warn(`[login-code] RESEND_API_KEY not set — code for ${session.email}: ${code}`)
      return NextResponse.json({ sent: true })
    }

    const { error: sendError } = await resend.emails.send({
      from: getReceiptFrom(),
      to: session.email,
      subject: `${code} is your ${SITE_NAME} sign-in code`,
      text:
        `Your ${SITE_NAME} sign-in code is ${code}.\n\n` +
        `It expires in ${LOGIN_CODE_TTL_MINUTES} minutes. If you didn't just try to sign in, ` +
        `someone may know your password — please change it.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px;color:#222">
          <p>Your ${SITE_NAME} sign-in code is:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0">${code}</p>
          <p style="color:#666;font-size:14px">It expires in ${LOGIN_CODE_TTL_MINUTES} minutes.
          If you didn't just try to sign in, someone may know your password — please change it.</p>
        </div>`,
    })
    if (sendError) throw sendError

    return NextResponse.json({ sent: true })
  } catch (error) {
    return serverError('login-code', error, "We couldn't send your sign-in code. Please try again.")
  }
}
