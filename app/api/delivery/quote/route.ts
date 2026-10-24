import { NextRequest, NextResponse } from 'next/server'
import { quoteDelivery } from '@/lib/geocode'
import { DELIVERY_RANGE_KM } from '@/lib/delivery'
import { clientIp, underRateLimit } from '@/lib/rate-limit'

// Public on purpose: it only geocodes an address and holds no customer data.
export async function POST(req: NextRequest) {
  try {
    // Checkout looks an address up on blur and again on submit; 30 per ten
    // minutes is plenty for a person and stops a script from burning through
    // the shared geocoder allowance.
    if (!(await underRateLimit(`quote:${clientIp(req)}`, 30, 10 * 60))) {
      return NextResponse.json(
        { error: 'Too many address checks. Please wait a few minutes and try again.', rangeKm: DELIVERY_RANGE_KM },
        { status: 429 }
      )
    }

    const { address } = await req.json()

    if (typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ found: false, reason: 'too_short', rangeKm: DELIVERY_RANGE_KM })
    }

    const quote = await quoteDelivery(address)
    return NextResponse.json({ ...quote, rangeKm: DELIVERY_RANGE_KM })
  } catch (error) {
    // Nominatim unreachable or timed out, or no shop location configured — the
    // caller must surface this rather than treating an unverified address as
    // deliverable.
    console.error('[delivery/quote] lookup failed:', error)
    return NextResponse.json(
      { error: 'Address lookup failed', rangeKm: DELIVERY_RANGE_KM },
      { status: 502 }
    )
  }
}
