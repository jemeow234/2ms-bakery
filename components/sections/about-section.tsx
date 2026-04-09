'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const stats = [
  { value: '14+', label: 'Years of Experience' },
  { value: '50K+', label: 'Happy Customers' },
  { value: '100+', label: 'Unique Recipes' },
  { value: '5AM', label: 'Fresh Every Day' },
]

const values = [
  {
    title: 'Quality Ingredients',
    description: 'We source only the finest organic flour, premium butter, and fresh local produce.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Traditional Methods',
    description: 'Time-honored techniques passed down through generations of master bakers.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
  },
  {
    title: 'Made with Love',
    description: 'Every loaf and pastry is crafted with passion and attention to detail.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
]

export function AboutSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-card relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span
            className={cn(
              'inline-block text-primary font-medium mb-4 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Our Story
          </span>
          <h2
            className={cn(
              'font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 delay-100 text-balance',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Crafting Memories
            <br />
            <span className="text-primary">One Loaf at a Time</span>
          </h2>
          <p
            className={cn(
              'text-muted-foreground text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 text-pretty',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            What started as a small family kitchen has grown into a beloved neighborhood 
            bakery, but our commitment to quality and tradition remains unchanged.
          </p>
        </div>

        {/* Stats */}
        <div
          className={cn(
            'grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 transition-all duration-700 delay-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors duration-300"
              style={{ transitionDelay: `${400 + index * 100}ms` }}
            >
              <div className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div
              key={value.title}
              className={cn(
                'group p-8 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-500',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: `${600 + index * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                {value.icon}
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {value.title}
              </h3>
              <p className="text-muted-foreground text-pretty">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
