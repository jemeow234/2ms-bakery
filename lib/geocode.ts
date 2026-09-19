// Server-only. Turns a typed address into a real distance from the bakery via
// OpenStreetMap's Nominatim. Do not import this from a client component.

import { BAKERY_ORIGIN, DELIVERY_RANGE_KM, calculateDistance } from '@/lib/delivery'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const COUNTRY_CODES = process.env.GEOCODE_COUNTRY_CODES ?? 'ph'

// Nominatim's usage policy requires an identifying User-Agent and caps callers
// at one request per second. Both are enforced below.
const USER_AGENT =
  process.env.GEOCODER_USER_AGENT ?? "2MsBakery/1.0 (bakery delivery range check)"
const MIN_INTERVAL_MS = 1100
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000

export interface GeoHit {
  lat: number
  lng: number
  displayName: string
}

export type DeliveryQuote =
  | { found: false }
  | { found: true; distanceKm: number; withinRange: boolean; matchedAddress: string }

const cache = new Map<string, { at: number; hit: GeoHit | null }>()

let queue: Promise<unknown> = Promise.resolve()
let lastCallAt = 0

/** Serialises calls and spaces them out, per Nominatim's rate limit. */
function schedule<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastCallAt)
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
    try {
      return await task()
    } finally {
      lastCallAt = Date.now()
    }
  })
  queue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

function cacheKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Resolves an address to coordinates, or null when Nominatim finds no match. */
export async function geocodeAddress(address: string): Promise<GeoHit | null> {
  const key = cacheKey(address)
  if (!key) return null

  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.hit

  // A throw here propagates (network/5xx) and is deliberately not cached.
  const hit = await schedule(async () => {
    const url = new URL(NOMINATIM_URL)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', COUNTRY_CODES)
    url.searchParams.set('q', address)

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Nominatim responded ${res.status}`)

    const json = await res.json()
    const first = Array.isArray(json) ? json[0] : null
    if (!first) return null

    const lat = Number(first.lat)
    const lng = Number(first.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return { lat, lng, displayName: String(first.display_name ?? address) }
  })

  cache.set(key, { at: Date.now(), hit })
  return hit
}

/**
 * The single source of truth for "how far away is this address" — used by both
 * the quote endpoint and order creation so the two can never disagree.
 * Distance is rounded once here, so the number shown is the number enforced.
 */
export async function quoteDelivery(address: string): Promise<DeliveryQuote> {
  const hit = await geocodeAddress(address)
  if (!hit) return { found: false }

  const raw = calculateDistance(BAKERY_ORIGIN.lat, BAKERY_ORIGIN.lng, hit.lat, hit.lng)
  const distanceKm = Math.round(raw * 10) / 10

  return {
    found: true,
    distanceKm,
    withinRange: distanceKm <= DELIVERY_RANGE_KM,
    matchedAddress: hit.displayName,
  }
}
