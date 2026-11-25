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
// the password step, and again from "Resend code". With `{ ifNoneOutstanding:
// true }` it only sends when this session has no unexpired code yet: used for
// sessions that started without the password step, such as the one the email
// confirmation link signs a new user into.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const ifNoneOutstanding = body?.ifNoneOutstanding === true

    const session = await currentSession()
    if (!session) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('login_verifications')
      .select('sent_at, verified_at, expires_at')
      .eq('session_id', session.sessionId)
      .maybeSingle()

    if (existing?.verified_at) {
      return NextResponse.json({ verified: true })
    }

    if (ifNoneOutstanding && existing && new Date(existing.expires_at).getTime() > Date.now()) {
      return NextResponse.json({ sent: true })
    }

    const sinceLast = existing ? (Date.now() - new Date(existing.sent_at).getTime()) / 1000 : Infinity
    if (sinceLast < LOGIN_CODE_RESEND_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(LOGIN_CODE_RESEND_SECONDS - sinceLast)}s before requesting another code.` },
        { status: 429 }
      )
    }

    const resend = getResend()
    const isProduction = process.env.NODE_ENV === 'production'
    if (!resend && isProduction) {
      return serverError('login-code', 'RESEND_API_KEY is not set', "We couldn't send your sign-in code.")
    }

    // Claim the right to send in a single statement, so requests that arrive
    // together can't each send a code: only the one that writes the row sends,
    // and the code in the inbox is always the one that's stored.
    const code = generateLoginCode()
    const codeHash = hashLoginCode(session.sessionId, code)
    const now = new Date()
    const row = {
      session_id: session.sessionId,
      user_id: session.userId,
      code_hash: codeHash,
      expires_at: new Date(now.getTime() + LOGIN_CODE_TTL_MINUTES * 60_000).toISOString(),
      attempts: 0,
      sent_at: now.toISOString(),
      verified_at: null,
    }

    let claimed: boolean
    if (!existing) {
      const { error } = await admin.from('login_verifications').insert(row)
      if (error && error.code !== '23505') throw error // 23505: another request got there first
      claimed = !error
    } else {
      let update = admin
        .from('login_verifications')
        .update(row)
        .eq('session_id', session.sessionId)
        .is('verified_at', null)
        .lt('sent_at', new Date(now.getTime() - LOGIN_CODE_RESEND_SECONDS * 1000).toISOString())
      if (ifNoneOutstanding) update = update.lt('expires_at', now.toISOString())
      const { data, error } = await update.select('session_id')
      if (error) throw error
      claimed = (data?.length ?? 0) > 0
    }

    if (!claimed) {
      // A code was just sent by a request running alongside this one.
      return ifNoneOutstanding
        ? NextResponse.json({ sent: true })
        : NextResponse.json({ error: 'A code was just sent. Please check your email.' }, { status: 429 })
    }

    // Counted only for the request that will actually send, so duplicates
    // that arrive together don't use up the customer's allowance.
    const allowed =
      (await underRateLimit(`login-code:user:${session.userId}`, 10, 3600)) &&
      (await underRateLimit(`login-code:ip:${clientIp(req)}`, 30, 3600))
    if (!allowed) {
      await admin
        .from('login_verifications')
        .delete()
        .eq('session_id', session.sessionId)
        .eq('code_hash', codeHash)
      return NextResponse.json({ error: 'Too many codes requested. Please try again later.' }, { status: 429 })
    }

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
    if (sendError) {
      // Nothing reached the inbox, so don't leave a code that makes later
      // requests think one is out.
      await admin
        .from('login_verifications')
        .delete()
        .eq('session_id', session.sessionId)
        .eq('code_hash', codeHash)
      throw sendError
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    return serverError('login-code', error, "We couldn't send your sign-in code. Please try again.")
  }
}
