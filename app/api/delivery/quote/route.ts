import { NextRequest, NextResponse } from 'next/server'
import { quoteDelivery } from '@/lib/geocode'
import { DELIVERY_RANGE_KM } from '@/lib/delivery'

// Public on purpose: checkout allows guest orders, so this must work signed out.
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()

    if (typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ found: false, reason: 'too_short', rangeKm: DELIVERY_RANGE_KM })
    }

    const quote = await quoteDelivery(address)
    return NextResponse.json({ ...quote, rangeKm: DELIVERY_RANGE_KM })
  } catch (error: any) {
    // Nominatim unreachable or timed out — the caller must surface this rather
    // than treating an unverified address as deliverable.
    return NextResponse.json(
      { error: error?.message ?? 'Address lookup failed', rangeKm: DELIVERY_RANGE_KM },
      { status: 502 }
    )
  }
}
