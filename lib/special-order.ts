import { z } from 'zod'
import { bakeryTodayISO } from './delivery.ts'

// Bulk ("special") order rules shared by the request form and its API, so the
// form never offers something the server will reject.

/** The quantity presets on the form. Anything else goes in "Others". */
export const SPECIAL_ORDER_PRESETS = [50, 100, 150, 200] as const

/** The smallest bulk order the bakery takes, including "Others" amounts. */
export const SPECIAL_ORDER_MINIMUM = SPECIAL_ORDER_PRESETS[0]
export const SPECIAL_ORDER_MAXIMUM = 10000

/** Bulk batches are baked to order, so they need this many days' notice. */
export const SPECIAL_ORDER_LEAD_DAYS = 1

/** The earliest date a special order can be needed for, as 'YYYY-MM-DD'. */
export function earliestSpecialOrderDate(now: Date = new Date()): string {
  const [year, month, day] = bakeryTodayISO(now).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + SPECIAL_ORDER_LEAD_DAYS)).toISOString().slice(0, 10)
}

export const specialOrderSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  email: z.string().trim().max(254).email('Please enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a phone number we can reach you on.')
    .max(30)
    .regex(/^[0-9+()\-\s]+$/, 'Please enter a valid phone number.'),
  product: z.string().trim().min(1, 'Please choose what you would like.').max(100),
  quantity: z
    .number({ error: 'Please choose a quantity.' })
    .int('Please enter a whole number of pieces.')
    .min(SPECIAL_ORDER_MINIMUM, `Special orders start at ${SPECIAL_ORDER_MINIMUM} pieces.`)
    .max(SPECIAL_ORDER_MAXIMUM, `For more than ${SPECIAL_ORDER_MAXIMUM} pieces, please call us.`),
  neededBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose the date you need it.'),
  fulfillment: z.enum(['pickup', 'delivery']),
  notes: z.string().trim().max(2000).optional().default(''),
})

export type SpecialOrderRequest = z.infer<typeof specialOrderSchema>

/** Validates a request; the date check needs "now", so it lives outside the schema. */
export function parseSpecialOrder(
  body: unknown,
  now: Date = new Date()
): { ok: true; data: SpecialOrderRequest } | { ok: false; error: string } {
  const parsed = specialOrderSchema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }
  const earliest = earliestSpecialOrderDate(now)
  if (parsed.data.neededBy < earliest) {
    return {
      ok: false,
      error: `Special orders need at least ${SPECIAL_ORDER_LEAD_DAYS} days' notice. Please choose ${earliest} or later.`,
    }
  }
  return { ok: true, data: parsed.data }
}
