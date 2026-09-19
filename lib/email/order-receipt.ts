import { BAKERY_ORIGIN, DeliverySession, formatSchedule } from '@/lib/delivery'

export interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

export interface ReceiptOrder {
  id: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  address?: string | null
  deliveryType: 'delivery' | 'pickup'
  deliveryDate?: string | null
  deliverySession?: DeliverySession | null
  distance?: number | null
  paymentMethod: string
  total: number
  items: ReceiptItem[]
}

export function shortOrderNumber(id: string): string {
  return id.slice(-6).toUpperCase()
}

function peso(amount: number): string {
  return `₱${amount.toFixed(2)}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPlacedAt(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt
  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  })
}

/** Plain-object renderer — no PDF or react-email dependency. */
export function renderOrderReceipt(order: ReceiptOrder): {
  subject: string
  html: string
  text: string
} {
  const number = shortOrderNumber(order.id)
  const placedAt = formatPlacedAt(order.createdAt)
  const schedule = formatSchedule(order.deliveryDate, order.deliverySession)

  const fulfilment =
    order.deliveryType === 'delivery'
      ? [
          'Delivery',
          order.address || undefined,
          order.distance != null ? `${order.distance.toFixed(1)} km from the bakery` : undefined,
        ]
      : ['Pick-up', BAKERY_ORIGIN.address]

  const fulfilmentLines = fulfilment.filter(Boolean) as string[]

  const rows = order.items
    .map(item => {
      const lineTotal = item.price * item.quantity
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;">
            ${escapeHtml(item.name)}
            <div style="color:#888;font-size:12px;">${peso(item.price)} × ${item.quantity}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;color:#333;white-space:nowrap;">
            ${peso(lineTotal)}
          </td>
        </tr>`
    })
    .join('')

  const html = `
<div style="margin:0;padding:24px;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;">
    <h1 style="margin:0 0 4px;font-size:22px;color:#1f1b16;">2M's Bakery</h1>
    <p style="margin:0 0 24px;color:#8a7f72;font-size:14px;">Official receipt</p>

    <p style="margin:0 0 6px;color:#333;font-size:15px;">Hi ${escapeHtml(order.customerName || 'there')},</p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.5;">
      Your order is complete. Thank you for baking with us!
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <tr>
        <td style="color:#888;font-size:13px;padding-bottom:4px;">Order</td>
        <td style="text-align:right;font-family:monospace;font-size:13px;color:#333;">#${escapeHtml(number)}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;padding-bottom:4px;">Placed</td>
        <td style="text-align:right;font-size:13px;color:#333;">${escapeHtml(placedAt)}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;">Payment</td>
        <td style="text-align:right;font-size:13px;color:#333;text-transform:capitalize;">${escapeHtml(order.paymentMethod)}</td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin:24px 0 0;">
      <thead>
        <tr><th colspan="2" style="text-align:left;font-size:13px;color:#888;font-weight:500;border-bottom:1px solid #eee;padding-bottom:8px;">Items</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td style="padding-top:14px;font-weight:600;color:#1f1b16;">Total</td>
          <td style="padding-top:14px;text-align:right;font-weight:700;font-size:18px;color:#b4622d;">${peso(order.total)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:24px;padding:16px;background:#faf7f2;border-radius:10px;">
      <p style="margin:0 0 6px;font-size:13px;color:#888;">Fulfilment</p>
      ${fulfilmentLines
        .map(line => `<p style="margin:0;font-size:14px;color:#333;">${escapeHtml(line)}</p>`)
        .join('')}
      ${schedule ? `<p style="margin:6px 0 0;font-size:14px;color:#333;">${escapeHtml(schedule)}</p>` : ''}
    </div>

    <p style="margin:24px 0 0;color:#999;font-size:12px;line-height:1.5;">
      Questions about this order? Reply to this email and quote #${escapeHtml(number)}.
    </p>
  </div>
</div>`.trim()

  const text = [
    `2M's Bakery — official receipt`,
    ``,
    `Hi ${order.customerName || 'there'}, your order is complete. Thank you!`,
    ``,
    `Order:   #${number}`,
    `Placed:  ${placedAt}`,
    `Payment: ${order.paymentMethod}`,
    ``,
    `Items`,
    ...order.items.map(
      item => `  ${item.name} — ${peso(item.price)} x ${item.quantity} = ${peso(item.price * item.quantity)}`
    ),
    ``,
    `Total: ${peso(order.total)}`,
    ``,
    `Fulfilment`,
    ...fulfilmentLines.map(line => `  ${line}`),
    ...(schedule ? [`  ${schedule}`] : []),
    ``,
    `Questions? Reply to this email and quote #${number}.`,
  ].join('\n')

  return { subject: `Your 2M's Bakery receipt · Order #${number}`, html, text }
}
