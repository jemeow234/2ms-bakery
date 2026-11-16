'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { startTour, TOUR_QUERY_PARAM } from '@/lib/onboarding'

// Replays the onboarding tour. The tour lives on the home page, so from any
// other page this links there with ?tour=1.
export function TakeTourLink({ className, children = 'Take the tour' }: { className?: string; children?: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/') {
    return (
      <button type="button" onClick={startTour} className={className}>
        {children}
      </button>
    )
  }

  return (
    <Link href={`/?${TOUR_QUERY_PARAM}=1`} className={className}>
      {children}
    </Link>
  )
}
