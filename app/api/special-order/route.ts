import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReceiptFrom, getResend } from '@/lib/email/client'
import { escapeHtml } from '@/lib/email/order-receipt'
import { clientIp, underRateLimit } from '@/lib/rate-limit'
import { CONTACT_INBOX_DEFAULT } from '@/lib/shop'
import { parseSpecialOrder } from '@/lib/special-order'

// Special (bulk) order requests land in the same inbox as contact messages.
// The bakery confirms price and availability by replying.
const SPECIAL_ORDER_TO = process.env.CONTACT_TO_EMAIL || CONTACT_INBOX_DEFAULT

export async function POST(req: NextRequest) {
  // Like regular orders, special orders require an account.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to send a special order request.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: the field is hidden from people, so only bots fill it in.
  // Pretend it worked so they don't retry.
  const { website } = (body ?? {}) as Record<string, unknown>
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const parsed = parseSpecialOrder(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const order = parsed.data

  if (!(await underRateLimit(`special-order:${clientIp(req)}`, 5, 60 * 60))) {
    return NextResponse.json(
      { error: "You've sent several requests already. Please try again later, or call or email us directly." },
      { status: 429 }
    )
  }

  const resend = getResend()
  if (!resend) {
    console.warn('[special-order] RESEND_API_KEY not set — cannot send special order request')
    return NextResponse.json(
      { error: 'Special orders are unavailable right now. Please call or email us directly.' },
      { status: 503 }
    )
  }

  const fulfillment = order.fulfillment === 'delivery' ? 'Delivery' : 'Pick-up'
  const rows: [string, string][] = [
    ['Name', order.name],
    ['Email', order.email],
    ['Phone', order.phone],
    ['Item', order.product],
    ['Quantity', `${order.quantity} pcs`],
    ['Needed by', order.neededBy],
    ['Pick-up / delivery', fulfillment],
  ]

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#333;">
      <h2 style="margin:0 0 16px;color:#8b5a2b;">New special order request</h2>
      ${rows
        .map(([label, value]) => `<p style="margin:0 0 4px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>`)
        .join('')}
      ${
        order.notes
          ? `<div style="margin-top:16px;padding:16px;background:#f7f3ee;border-radius:8px;white-space:pre-wrap;line-height:1.5;">${escapeHtml(order.notes)}</div>`
          : ''
      }
      <p style="margin:16px 0 0;font-size:12px;color:#888;">Reply to this email to confirm the order with ${escapeHtml(order.name)} directly.</p>
    </div>`

  const text = [
    'New special order request',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(order.notes ? ['', order.notes] : []),
  ].join('\n')

  // Header fields must be single-line.
  const subjectName = order.name.replace(/[\r\n]+/g, ' ')
  const subjectProduct = order.product.replace(/[\r\n]+/g, ' ')

  try {
    const result = await resend.emails.send({
      from: getReceiptFrom(),
      to: SPECIAL_ORDER_TO,
      replyTo: order.email,
      subject: `Special order: ${order.quantity} × ${subjectProduct} for ${order.neededBy} (${subjectName})`,
      html,
      text,
    })
    if (result.error) throw new Error(result.error.message)
  } catch (error) {
    console.error('[special-order] send failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'We couldn\'t send your request. Please try again or contact us directly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
