'use client'

import { useEffect, useRef, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { initialProducts } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'all', label: 'All Products' },
  { id: 'bread', label: 'Breads' },
  { id: 'pastry', label: 'Pastries' },
  { id: 'cake', label: 'Cakes' },
  { id: 'cookie', label: 'Cookies' },
]

const PAGE_SIZE = 8

export function ProductsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  const filteredProducts = activeCategory === 'all'
    ? initialProducts
    : initialProducts.filter(p => p.category === activeCategory)

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    setVisibleCount(PAGE_SIZE)
  }

  useEffect(() => {
    const onCategorySelect = (e: Event) => {
      const { category } = (e as CustomEvent<{ category: string }>).detail
      handleCategoryChange(category)
    }

    window.addEventListener('products-category-select', onCategorySelect)
    return () => window.removeEventListener('products-category-select', onCategorySelect)
  }, [])

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
    <section id="products" ref={sectionRef} className="py-24 bg-secondary/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span
            className={cn(
              'inline-block text-primary font-medium mb-4 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Our Menu
          </span>
          <h2
            className={cn(
              'font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 delay-100 text-balance',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Fresh From <span className="text-primary">Our Oven</span>
          </h2>
          <p
            className={cn(
              'text-muted-foreground text-lg max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 text-pretty',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Browse our complete selection of artisan breads, pastries, cakes, and more.
          </p>

          {/* Category Filter */}
          <div
            className={cn(
              'flex flex-wrap justify-center gap-3 transition-all duration-700 delay-300',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  'transition-all duration-300',
                  activeCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border-primary/30 text-foreground hover:bg-primary hover:text-primary-foreground'
                )}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleProducts.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                'transition-all duration-500',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: `${400 + (index % 8) * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
              className="border-primary/30 text-foreground hover:bg-primary hover:text-primary-foreground px-8"
            >
              Load More
            </Button>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
