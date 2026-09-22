// Delivery rules shared by the checkout UI and the order API, so the client can
// never offer something the server will reject.

export const MINIMUM_ORDER_QUANTITY = 2
export const DELIVERY_RANGE_KM = 1

/** A session closes this many hours before it starts. */
export const ORDER_LEAD_HOURS = 2

/**
 * The bakery trades in a single fixed-offset timezone (Philippines, UTC+8, no
 * DST). Slot maths is done against that offset rather than the runtime's local
 * time, so a server in UTC and a browser in Manila agree on what "today" means.
 */
const BAKERY_UTC_OFFSET_HOURS = 8

export type DeliverySession = 'morning' | 'afternoon'

export const DELIVERY_SESSIONS = {
  morning: { key: 'morning', label: 'Morning', start: '08:00', end: '11:00' },
  afternoon: { key: 'afternoon', label: 'Afternoon', start: '13:00', end: '16:00' },
} as const

export const DELIVERY_SESSION_KEYS = ['morning', 'afternoon'] as const

// Placeholder coordinates until the real shop location is known — see
// NEXT_PUBLIC_BAKERY_* in .env.local. Every distance is wrong until these are set.
export const BAKERY_ORIGIN = {
  lat: Number(process.env.NEXT_PUBLIC_BAKERY_LAT ?? '14.5995'),
  lng: Number(process.env.NEXT_PUBLIC_BAKERY_LNG ?? '120.9842'),
  address: process.env.NEXT_PUBLIC_BAKERY_ADDRESS ?? "2M's Bakery, Manila, Philippines",
}

/** Great-circle distance in km. */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function isDeliverySession(value: unknown): value is DeliverySession {
  return value === 'morning' || value === 'afternoon'
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** '08:00' -> '8:00 AM' */
export function formatTime(hhmm: string): string {
  const [hh, mm] = hhmm.split(':').map(Number)
  const suffix = hh >= 12 ? 'PM' : 'AM'
  const hour = hh % 12 === 0 ? 12 : hh % 12
  return `${hour}:${String(mm).padStart(2, '0')} ${suffix}`
}

/** 'morning' -> 'Morning (8:00 AM – 11:00 AM)' */
export function formatSession(session: DeliverySession): string {
  const { label, start, end } = DELIVERY_SESSIONS[session]
  return `${label} (${formatTime(start)} – ${formatTime(end)})`
}

/** 'YYYY-MM-DD' + session -> the instant that session opens. */
export function sessionStartsAt(dateISO: string, session: DeliverySession): Date {
  const [year, month, day] = dateISO.split('-').map(Number)
  const [hh, mm] = DELIVERY_SESSIONS[session].start.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hh - BAKERY_UTC_OFFSET_HOURS, mm))
}

/** Today's date in the bakery's timezone, as 'YYYY-MM-DD'. */
export function bakeryTodayISO(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + BAKERY_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

/** Which sessions can still be booked on the given date. */
export function getSelectableSessions(
  dateISO: string,
  now: Date = new Date(),
  slackMs = 0
): DeliverySession[] {
  if (!isDateString(dateISO)) return []
  const cutoff = now.getTime() + ORDER_LEAD_HOURS * 60 * 60 * 1000 - slackMs
  return DELIVERY_SESSION_KEYS.filter(key => sessionStartsAt(dateISO, key).getTime() >= cutoff)
}

/**
 * Server-side counterpart to getSelectableSessions: rejects whatever the UI
 * disables. `slackMs` absorbs clock skew between browser and server.
 */
export function isScheduleValid(
  dateISO: unknown,
  session: unknown,
  now: Date = new Date(),
  slackMs = 5 * 60 * 1000
): boolean {
  if (!isDateString(dateISO) || !isDeliverySession(session)) return false
  return getSelectableSessions(dateISO, now, slackMs).includes(session)
}

export function formatSchedule(
  dateISO?: string | null,
  session?: DeliverySession | null
): string | null {
  if (!isDateString(dateISO) || !isDeliverySession(session)) return null
  const [year, month, day] = dateISO.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const label = date.toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return `${label} · ${formatSession(session)}`
}
