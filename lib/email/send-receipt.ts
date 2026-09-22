import { createClient } from '@/lib/supabase/server'
import { getReceiptFrom, getResend } from './client'
import { renderOrderReceipt, ReceiptOrder } from './order-receipt'

/**
 * Emails the customer a receipt for a completed order, exactly once.
 *
 * Idempotency is a claim-then-send: receipt_sent_at is stamped with a
 * conditional update first, so two concurrent completions can't both win. If
 * the send then fails the claim is released and the next completion retries.
 *
 * Never throws — a receipt must not fail the status update that triggered it.
 */
export async function sendOrderReceipt(orderId: string): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn(`[receipt] RESEND_API_KEY not set — skipping receipt for ${orderId}`)
      return
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('orders')
      .select(`*, order_items ( product_name, quantity, price )`)
      .eq('id', orderId)
      .single()

    if (error || !row) {
      console.error(`[receipt] could not load order ${orderId}:`, error?.message)
      return
    }

    if (row.status !== 'completed') return
    if (row.receipt_sent_at) {
      console.log(`[receipt] already sent for ${orderId} at ${row.receipt_sent_at} — skipping`)
      return
    }
    // POS walk-ins have no email address.
    if (!row.customer_email) {
      console.log(`[receipt] order ${orderId} has no customer email — skipping`)
      return
    }

    // Claim the send before doing it.
    const { data: claimed, error: claimError } = await supabase
      .from('orders')
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq('id', orderId)
      .is('receipt_sent_at', null)
      .select('id')

    if (claimError) {
      console.error(`[receipt] could not claim order ${orderId}:`, claimError.message)
      return
    }
    if (!claimed || claimed.length === 0) {
      // Another run already has it — or RLS silently blocked the update.
      console.warn(`[receipt] could not claim order ${orderId} (already claimed or update blocked)`)
      return
    }

    const order: ReceiptOrder = {
      id: row.id,
      createdAt: row.created_at,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      address: row.address,
      deliveryType: row.delivery_type,
      deliveryDate: row.delivery_date,
      deliverySession: row.delivery_session,
      distance: row.distance,
      paymentMethod: row.payment_method,
      total: Number(row.total),
      items: (row.order_items || []).map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
    }

    const { subject, html, text } = renderOrderReceipt(order)

    let sendError: unknown = null
    try {
      const result = await resend.emails.send({
        from: getReceiptFrom(),
        to: order.customerEmail,
        subject,
        html,
        text,
      })
      sendError = result.error
    } catch (err) {
      // A thrown send (network drop, timeout) must release the claim too,
      // otherwise the order looks "already sent" forever.
      sendError = err
    }

    if (sendError) {
      console.error(`[receipt] send failed for ${orderId}:`, sendError)
      // Release the claim so a later completion can retry.
      await supabase.from('orders').update({ receipt_sent_at: null }).eq('id', orderId)
      return
    }

    console.log(`[receipt] sent for order ${orderId}`)
  } catch (err) {
    console.error(`[receipt] unexpected failure for ${orderId}:`, err)
  }
}
