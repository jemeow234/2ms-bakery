'use client'

import { useEffect, useRef, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { useStore } from '@/context/store-context'
import { cn } from '@/lib/utils'

export function FeaturedSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { products } = useStore()

  const featuredProducts = products.filter(p => p.featured)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="featured" ref={sectionRef} className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span
            className={cn(
              'inline-block text-primary font-medium mb-4 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Customer Favorites
          </span>
          <h2
            className={cn(
              'font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 delay-100 text-balance',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Our <span className="text-primary">Featured</span> Selection
          </h2>
          <p
            className={cn(
              'text-muted-foreground text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 text-pretty',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Discover our most beloved creations, crafted with passion and perfected over years
            of baking tradition.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {featuredProducts[0] && (
            <div
              className={cn(
                'lg:col-span-3 transition-all duration-700',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: '300ms' }}
            >
              <ProductCard product={featuredProducts[0]} variant="spotlight" />
            </div>
          )}

          <div className="lg:col-span-2 flex flex-col gap-4 lg:h-full lg:justify-between">
            {featuredProducts.slice(1).map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  'transition-all duration-700',
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
                style={{ transitionDelay: `${450 + index * 150}ms` }}
              >
                <ProductCard product={product} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
