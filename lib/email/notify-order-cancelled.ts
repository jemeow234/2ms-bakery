import { createAdminClient } from '@/lib/supabase/admin'
import { formatSchedule } from '@/lib/delivery'
import { shortOrderNumber } from '@/lib/orders'
import { SITE_URL } from '@/lib/site'
import { formatPaymentMethod } from '@/lib/utils'
import { getReceiptFrom, getResend } from './client'
import { ALERT_TO } from './notify-new-order'
import { escapeHtml } from './order-receipt'

/**
 * Emails the bakery that a customer cancelled their order, so nobody prepares
 * it and any GCash payment gets refunded.
 *
 * Never throws — an alert must not fail the cancellation that triggered it.
 */
export async function notifyOrderCancelled(orderId: string): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn(`[order-alert] RESEND_API_KEY not set — skipping cancellation alert for ${orderId}`)
      return
    }

    const { data: row, error } = await createAdminClient()
      .from('orders')
      .select('id, customer_name, customer_phone, customer_email, delivery_type, delivery_date, delivery_session, payment_method, total')
      .eq('id', orderId)
      .single()

    if (error || !row) {
      console.error(`[order-alert] could not load order ${orderId}:`, error?.message)
      return
    }

    const orderNo = shortOrderNumber(row.id)
    const total = `₱${Number(row.total).toFixed(2)}`
    const needsRefund = row.payment_method === 'gcash'
    const adminUrl = `${SITE_URL}/admin/orders`

    const details: [string, string][] = [
      ['Customer', row.customer_name || '—'],
      ['Phone', row.customer_phone || '—'],
      ['Email', row.customer_email || '—'],
      [row.delivery_type === 'delivery' ? 'Delivery' : 'Pick-up', formatSchedule(row.delivery_date, row.delivery_session) || '—'],
      ['Payment', formatPaymentMethod(row.payment_method)],
      ['Total', total],
    ]

    const intro = 'The customer cancelled this order, and its stock has been put back.'
    const refundNote = `Refund needed: this order was paid by GCash/InstaPay. Please contact the customer about refunding ${total}.`

    const text = [
      `Order #${orderNo} was cancelled`,
      '',
      intro,
      ...(needsRefund ? ['', refundNote] : []),
      '',
      ...details.map(([label, value]) => `${label}: ${value}`),
      '',
      `Open the admin panel: ${adminUrl}`,
    ].join('\n')

    const html = `
      <div style="font-family:Arial,sans-serif;color:#2b2118;max-width:520px">
        <h2 style="margin:0 0 12px">Order #${escapeHtml(orderNo)} was cancelled</h2>
        <p style="font-size:14px;margin:0 0 12px">${escapeHtml(intro)}</p>
        ${needsRefund ? `<p style="font-size:14px;font-weight:bold;margin:0 0 12px">${escapeHtml(refundNote)}</p>` : ''}
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
          ${details.map(([label, value]) => `
            <tr>
              <td style="padding:4px 12px 4px 0;color:#7a6a5c">${escapeHtml(label)}</td>
              <td style="padding:4px 0">${escapeHtml(value)}</td>
            </tr>`).join('')}
        </table>
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#8b5a2b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
          Open the admin panel
        </a>
      </div>`

    const result = await resend.emails.send({
      from: getReceiptFrom(),
      to: ALERT_TO,
      subject: `${needsRefund ? 'Refund needed: order' : 'Order'} #${orderNo} cancelled — ${total}`,
      html,
      text,
    })

    if (result.error) {
      console.error(`[order-alert] cancellation alert failed for ${orderId}:`, result.error)
      return
    }

    console.log(`[order-alert] cancellation alert sent for order ${orderId}`)
  } catch (err) {
    console.error(`[order-alert] unexpected failure for ${orderId}:`, err)
  }
}
