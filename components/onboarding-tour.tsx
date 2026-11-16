'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import {
  hasSeenTour,
  markTourSeen,
  START_TOUR_EVENT,
  TOUR_QUERY_PARAM,
  TOUR_STEPS,
  type TourStep,
} from '@/lib/onboarding'

const GUTTER = 16
const GAP = 12
const PADDING = 6
const CARD_WIDTH = 360
const CARD_ESTIMATED_HEIGHT = 230

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function findTarget(step: TourStep, signedIn: boolean): HTMLElement | null {
  if (!step.target || (step.signedInOnly && !signedIn)) return null
  const root = step.scope ? document.querySelector(step.scope) : document
  if (!root) return null
  const matches = root.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`)
  for (const el of matches) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

// Another dialog (e.g. the sign-in announcement) is open; wait for it.
function otherDialogOpen() {
  return document.querySelector('[role="dialog"]:not([data-onboarding-tour])') !== null
}

// Step-by-step spotlight tour of the storefront for first-time visitors.
// Starts automatically once per browser, or on demand via startTour() / ?tour=1.
export function OnboardingTour() {
  const { user } = useAuth()
  const signedIn = Boolean(user)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  const begin = useCallback(() => {
    markTourSeen()
    setIndex(0)
    setOpen(true)
  }, [])

  // Auto-start for first-time visitors, manual start via event or ?tour=1.
  useEffect(() => {
    window.addEventListener(START_TOUR_EVENT, begin)

    let timer: ReturnType<typeof setTimeout> | undefined
    const params = new URLSearchParams(window.location.search)
    if (params.has(TOUR_QUERY_PARAM)) {
      // Strip ?tour=1 only when starting, so a re-run of this effect still sees it.
      timer = setTimeout(() => {
        params.delete(TOUR_QUERY_PARAM)
        const query = params.toString()
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
        begin()
      }, 400)
    } else if (!hasSeenTour()) {
      const tryStart = () => {
        if (otherDialogOpen()) timer = setTimeout(tryStart, 600)
        else begin()
      }
      timer = setTimeout(tryStart, 1200)
    }

    return () => {
      window.removeEventListener(START_TOUR_EVENT, begin)
      if (timer) clearTimeout(timer)
    }
  }, [begin])

  const step = TOUR_STEPS[index]

  // Find, scroll to and keep measuring the current step's target.
  useEffect(() => {
    if (!open) return
    const target = findTarget(step, signedIn)
    targetRef.current = target
    if (target) {
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    }

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setViewport({ width: document.documentElement.clientWidth, height: window.innerHeight })
        const el = targetRef.current
        if (!el) {
          setRect(null)
          return
        }
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      })
    }
    measure()
    // Smooth scrolling and entrance animations move the target for a moment.
    const settle = [150, 400, 800].map(ms => setTimeout(measure, ms))
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      settle.forEach(clearTimeout)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [open, step, signedIn])

  const close = useCallback(() => {
    setOpen(false)
    setRect(null)
  }, [])

  const next = useCallback(() => {
    if (index < TOUR_STEPS.length - 1) setIndex(i => i + 1)
    else {
      close()
      document.getElementById('products')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    }
  }, [index, close])

  const back = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])

  // Keyboard controls and focus.
  useEffect(() => {
    if (!open) return
    cardRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, next, back, close])

  if (!open || typeof document === 'undefined') return null

  const isFirst = index === 0
  const isLast = index === TOUR_STEPS.length - 1
  const body = signedIn && step.signedInBody ? step.signedInBody : step.body

  // Clip the spotlight to the viewport (e.g. a tall section).
  const vw = viewport.width || document.documentElement.clientWidth
  const vh = viewport.height || window.innerHeight
  const spot = rect
    ? (() => {
        const top = Math.max(rect.top - PADDING, 4)
        const left = Math.max(rect.left - PADDING, 4)
        const bottom = Math.min(rect.top + rect.height + PADDING, vh - 4)
        const right = Math.min(rect.left + rect.width + PADDING, vw - 4)
        return bottom > top && right > left ? { top, left, width: right - left, height: bottom - top } : null
      })()
    : null

  // Card goes below the spotlight, else above, else pinned to the bottom.
  const cardWidth = Math.min(CARD_WIDTH, vw - GUTTER * 2)
  let cardStyle: React.CSSProperties
  if (spot) {
    const left = Math.min(Math.max(spot.left + spot.width / 2 - cardWidth / 2, GUTTER), vw - cardWidth - GUTTER)
    const spaceBelow = vh - (spot.top + spot.height) - GAP
    const spaceAbove = spot.top - GAP
    if (spaceBelow >= CARD_ESTIMATED_HEIGHT) cardStyle = { top: spot.top + spot.height + GAP, left, width: cardWidth }
    else if (spaceAbove >= CARD_ESTIMATED_HEIGHT) cardStyle = { bottom: vh - spot.top + GAP, left, width: cardWidth }
    else cardStyle = { bottom: GUTTER, left: (vw - cardWidth) / 2, width: cardWidth }
  } else {
    cardStyle = { top: '50%', left: '50%', width: cardWidth, transform: 'translate(-50%, -50%)' }
  }

  return createPortal(
    <div data-onboarding-tour className="fixed inset-0 z-[100]">
      {/* Backdrop: clicks on it are swallowed so the page isn't used mid-tour. */}
      {spot ? (
        <div
          aria-hidden="true"
          className="fixed rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent motion-safe:transition-all motion-safe:duration-300 pointer-events-none"
          style={{ ...spot, boxShadow: '0 0 0 9999px rgba(20, 12, 6, 0.6)' }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[rgba(20,12,6,0.6)]" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-body"
        data-onboarding-tour
        tabIndex={-1}
        className={cn(
          'fixed rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 outline-none',
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95'
        )}
        style={cardStyle}
        key={step.id}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Skip tour"
          className="absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-medium text-primary mb-1">
          Step {index + 1} of {TOUR_STEPS.length}
        </p>
        <h2 id="onboarding-title" className="font-serif text-xl font-bold text-foreground pr-6 mb-2">
          {step.title}
        </h2>
        <p id="onboarding-body" className="text-sm text-muted-foreground leading-relaxed">
          {body}
        </p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-4" aria-hidden="true">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-primary' : 'w-1.5 bg-border')}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          {isFirst ? (
            <Button variant="ghost" size="sm" onClick={close} className="text-muted-foreground">
              Skip tour
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button size="sm" onClick={next} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isFirst ? "Let's go" : isLast ? 'Start shopping' : 'Next'}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
