import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { serverError, getVerifiedUser } from '@/lib/api'
import { underRateLimit } from '@/lib/rate-limit'

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
})

/**
 * Starts a sign-in email change. Supabase emails a confirmation link (to the
 * new address, and to the current one too when "Secure email change" is on)
 * and only switches the email once it's clicked. The profile row follows via
 * the on_auth_user_email_changed trigger (migration 0028).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getVerifiedUser(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Please sign in again to change your email.' }, { status: 401 })
    }

    const parsed = emailSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    const { email } = parsed.data

    if (email === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'That is already your email.' }, { status: 400 })
    }

    // Each request sends real emails.
    if (!(await underRateLimit(`email-change:${user.id}`, 5, 60 * 60))) {
      return NextResponse.json(
        { error: 'Too many email change requests. Please try again in an hour.' },
        { status: 429 }
      )
    }

    const { error } = await supabase.auth.updateUser(
      { email },
      // Same landing page as the sign-up confirmation link, which the
      // project's redirect allow-list already accepts.
      { emailRedirectTo: `${req.nextUrl.origin}/` }
    )

    if (error) {
      if (error.code === 'email_exists' || /already been registered/i.test(error.message)) {
        return NextResponse.json({ error: 'Another account already uses that email.' }, { status: 409 })
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Too many emails sent. Please wait a few minutes and try again.' },
          { status: 429 }
        )
      }
      throw error
    }

    return NextResponse.json({ pendingEmail: email })
  } catch (error) {
    return serverError('users/email', error, "Couldn't start the email change. Please try again.")
  }
}
