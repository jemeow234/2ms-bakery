import { NextRequest, NextResponse } from 'next/server'
import { getReceiptFrom, getResend } from '@/lib/email/client'
import { escapeHtml } from '@/lib/email/order-receipt'

// Where "Send us a Message" submissions land. Override with CONTACT_TO_EMAIL.
const CONTACT_TO = process.env.CONTACT_TO_EMAIL || 'dunwellaranas@gmail.com'

const MAX_NAME = 100
const MAX_EMAIL = 254
const MAX_MESSAGE = 5000

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, email, message, website } = (body ?? {}) as Record<string, unknown>

  // Honeypot: the field is hidden from people, so only bots fill it in.
  // Pretend it worked so they don't retry.
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanEmail = typeof email === 'string' ? email.trim() : ''
  const cleanMessage = typeof message === 'string' ? message.trim() : ''

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return NextResponse.json({ error: 'Please fill in your name, email and message.' }, { status: 400 })
  }
  if (
    cleanName.length > MAX_NAME ||
    cleanEmail.length > MAX_EMAIL ||
    cleanMessage.length > MAX_MESSAGE
  ) {
    return NextResponse.json({ error: 'Your message is too long.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const resend = getResend()
  if (!resend) {
    console.warn('[contact] RESEND_API_KEY not set — cannot send contact message')
    return NextResponse.json(
      { error: 'Messaging is unavailable right now. Please call or email us directly.' },
      { status: 503 }
    )
  }

  // Header fields must be single-line.
  const subjectName = cleanName.replace(/[\r\n]+/g, ' ')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#333;">
      <h2 style="margin:0 0 16px;color:#8b5a2b;">New message from the website</h2>
      <p style="margin:0 0 4px;"><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
      <p style="margin:0 0 16px;"><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
      <div style="padding:16px;background:#f7f3ee;border-radius:8px;white-space:pre-wrap;line-height:1.5;">${escapeHtml(cleanMessage)}</div>
      <p style="margin:16px 0 0;font-size:12px;color:#888;">Reply to this email to answer ${escapeHtml(cleanName)} directly.</p>
    </div>`

  const text = [
    'New message from the website',
    '',
    `Name:  ${cleanName}`,
    `Email: ${cleanEmail}`,
    '',
    cleanMessage,
  ].join('\n')

  try {
    const result = await resend.emails.send({
      from: getReceiptFrom(),
      to: CONTACT_TO,
      replyTo: cleanEmail,
      subject: `Website message from ${subjectName}`,
      html,
      text,
    })
    if (result.error) throw new Error(result.error.message)
  } catch (error) {
    console.error('[contact] send failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'We couldn\'t send your message. Please try again or contact us directly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
