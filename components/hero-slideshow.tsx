'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const FIRST_SLIDE = {
  image: '/images/bicho.jpg',
  name: 'Bicho',
  alt: 'Freshly fried bicho rolled in sugar, on a bronze tray',
}
const MAX_SLIDES = 10
const INTERVAL_MS = 4500
const SIZES = '(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 90vw'

interface Slide {
  image: string
  name: string
  alt: string
}

// One slide per photo; products sharing a picture (variants) appear once.
function buildSlides(products: Product[]): Slide[] {
  const seen = new Set([FIRST_SLIDE.image])
  const slides: Slide[] = [FIRST_SLIDE]
  for (const p of products) {
    if (slides.length >= MAX_SLIDES) break
    if (!p.image || p.image.includes('placeholder') || seen.has(p.image)) continue
    seen.add(p.image)
    slides.push({ image: p.image, name: p.name, alt: p.name })
  }
  return slides
}

function randomOther(count: number, current: number) {
  if (count < 2) return current
  const pick = Math.floor(Math.random() * (count - 1))
  return pick >= current ? pick + 1 : pick
}

// Hero photo that fades to a random menu item every few seconds.
// Starts on the bicho photo so the server render and first paint never change.
export function HeroSlideshow({ products }: { products: Product[] }) {
  const slides = useMemo(() => buildSlides(products), [products])
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  // Chosen ahead of time so its photo is already loading before it shows.
  const [upcoming, setUpcoming] = useState(slides.length > 1 ? 1 : 0)

  const goTo = (index: number) => {
    if (index === current) return
    setPrevious(current)
    setCurrent(index)
    setUpcoming(randomOther(slides.length, index))
  }

  // Each slide schedules the next one; a manual pick restarts the wait.
  // With reduced motion the photos still change, just without the fade.
  useEffect(() => {
    if (slides.length < 2) return
    const timer = setTimeout(() => {
      setPrevious(current)
      setCurrent(upcoming)
      setUpcoming(randomOther(slides.length, upcoming))
    }, INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [slides.length, current, upcoming])

  const mounted = new Set([current, upcoming, ...(previous === null ? [] : [previous])])

  return (
    <div
      className="relative aspect-[4/3] sm:aspect-square lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl bg-secondary"
      role="region"
      aria-roledescription="carousel"
      aria-label="Our breads"
    >
      {slides.map((slide, i) =>
        mounted.has(i) ? (
          <Image
            key={slide.image}
            src={slide.image}
            alt={slide.alt}
            fill
            loading="eager"
            fetchPriority={i === 0 ? 'high' : 'low'}
            sizes={SIZES}
            aria-hidden={i !== current}
            className={cn(
              'object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none',
              i === current ? 'opacity-100' : 'opacity-0'
            )}
          />
        ) : null
      )}

      {slides.length > 1 && (
        <>
          <span
            aria-live="polite"
            className="absolute top-4 right-4 rounded-full bg-background/85 backdrop-blur px-3 py-1 text-sm font-medium text-foreground shadow"
          >
            {slides[current].name}
          </span>
          <div className="absolute bottom-4 right-4 flex gap-1.5 rounded-full bg-background/70 backdrop-blur px-2.5 py-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${slide.name}`}
                aria-current={i === current}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === current ? 'w-5 bg-primary' : 'w-2 bg-foreground/30 hover:bg-foreground/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
