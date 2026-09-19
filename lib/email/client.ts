import { Resend } from 'resend'

let cached: Resend | null = null

/**
 * Returns null when RESEND_API_KEY is unset, so local dev and `next build`
 * work without mail configured — callers skip sending instead of throwing.
 */
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!cached) cached = new Resend(apiKey)
  return cached
}

export function getReceiptFrom(): string {
  // Resend's shared sender works for testing; real customer mail needs a
  // verified domain in RECEIPT_FROM_EMAIL.
  return process.env.RECEIPT_FROM_EMAIL || "2M's Bakery <onboarding@resend.dev>"
}
