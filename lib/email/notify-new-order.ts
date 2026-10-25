import { createAdminClient } from '@/lib/supabase/admin'
import { formatSchedule } from '@/lib/delivery'
import { shortOrderNumber } from '@/lib/orders'
import { CONTACT_INBOX_DEFAULT } from '@/lib/shop'
import { SITE_URL } from '@/lib/site'
import { formatPaymentMethod } from '@/lib/utils'
import { getReceiptFrom, getResend } from './client'
import { escapeHtml } from './order-receipt'

// Where new-order alerts land. Override with ORDER_ALERT_EMAIL.
const ALERT_TO = process.env.ORDER_ALERT_EMAIL || CONTACT_INBOX_DEFAULT

const peso = (amount: number) => `₱${amount.toFixed(2)}`

/**
 * Emails the bakery that a customer placed an order.
 *
 * Never throws — an alert must not fail the order that triggered it.
 */
export async function notifyNewOrder(orderId: string): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn(`[order-alert] RESEND_API_KEY not set — skipping alert for ${orderId}`)
      return
    }

    const { data: row, error } = await createAdminClient()
      .from('orders')
      .select(`*, order_items ( product_name, quantity, price )`)
      .eq('id', orderId)
      .single()

    if (error || !row) {
      console.error(`[order-alert] could not load order ${orderId}:`, error?.message)
      return
    }

    const orderNo = shortOrderNumber(row.id)
    const items = (row.order_items ?? []) as { product_name: string; quantity: number; price: number | string }[]
    const schedule = formatSchedule(row.delivery_date, row.delivery_session)
    const fulfilment = row.delivery_type === 'delivery' ? 'Delivery' : 'Pick-up'
    const total = peso(Number(row.total))
    const adminUrl = `${SITE_URL}/admin/orders`

    const details: [string, string][] = [
      ['Customer', row.customer_name || '—'],
      ['Phone', row.customer_phone || '—'],
      ['Email', row.customer_email || '—'],
      [fulfilment, schedule || '—'],
      ...(row.delivery_type === 'delivery' ? [['Address', row.address || '—'] as [string, string]] : []),
      ['Payment', formatPaymentMethod(row.payment_method)],
      ['Total', total],
    ]

    const itemLines = items.map(item => ({
      label: `${item.quantity}× ${item.product_name}`,
      amount: peso(Number(item.price) * item.quantity),
    }))

    const subject = `New order #${orderNo} — ${total}`

    const text = [
      `New order #${orderNo}`,
      '',
      ...details.map(([label, value]) => `${label}: ${value}`),
      '',
      'Items:',
      ...itemLines.map(line => `  ${line.label} — ${line.amount}`),
      '',
      `Open the admin panel: ${adminUrl}`,
    ].join('\n')

    const html = `
      <div style="font-family:Arial,sans-serif;color:#2b2118;max-width:520px">
        <h2 style="margin:0 0 12px">New order #${escapeHtml(orderNo)}</h2>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
          ${details.map(([label, value]) => `
            <tr>
              <td style="padding:4px 12px 4px 0;color:#7a6a5c">${escapeHtml(label)}</td>
              <td style="padding:4px 0">${escapeHtml(value)}</td>
            </tr>`).join('')}
        </table>
        <table style="border-collapse:collapse;font-size:14px;width:100%;margin-bottom:16px">
          ${itemLines.map(line => `
            <tr>
              <td style="padding:4px 0;border-bottom:1px solid #eee">${escapeHtml(line.label)}</td>
              <td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">${escapeHtml(line.amount)}</td>
            </tr>`).join('')}
        </table>
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#8b5a2b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
          Open the admin panel
        </a>
      </div>`

    const result = await resend.emails.send({
      from: getReceiptFrom(),
      to: ALERT_TO,
      subject,
      html,
      text,
    })

    if (result.error) {
      console.error(`[order-alert] send failed for ${orderId}:`, result.error)
      return
    }

    console.log(`[order-alert] sent for order ${orderId}`)
  } catch (err) {
    console.error(`[order-alert] unexpected failure for ${orderId}:`, err)
  }
}
