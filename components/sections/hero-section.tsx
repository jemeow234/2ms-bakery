'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY
        const opacity = Math.max(0, 1 - scrollY / 500)
        const translateY = scrollY * 0.3
        heroRef.current.style.opacity = String(opacity)
        heroRef.current.style.transform = `translateY(${translateY}px)`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToFeatured = () => {
    const element = document.getElementById('featured')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-16 lg:pt-24 lg:pb-0"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent/20" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23926b4a' fill-opacity='0.4'%3E%3Ccircle cx='5' cy='5' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div ref={heroRef} className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Text */}
          <div className="text-center lg:text-left">
            <div className="animate-fade-in">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6 animate-slide-down">
                Artisan Bakery Since 2010
              </span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-slide-up text-balance">
              Baked Fresh
              <br />
              <span className="text-primary">Every Morning</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto lg:mx-0 mb-10 animate-fade-in text-pretty">
              Experience the warmth of handcrafted breads and pastries made with
              traditional recipes and the finest ingredients.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up">
              <Button
                size="lg"
                onClick={scrollToFeatured}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                Explore Our Menu
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg font-medium transition-all duration-300"
              >
                Our Story
              </Button>
            </div>
          </div>

          {/* Hero photo */}
          <div className="relative animate-fade-in">
            <div className="absolute -inset-6 bg-accent/25 rounded-[2.5rem] rotate-3 hidden sm:block" />
            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl">
              <Image
                src="/images/sourdough.jpg"
                alt="Freshly baked sourdough loaf, dusted with flour, on a wooden board"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToFeatured}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-primary hover:text-primary/80 transition-colors hidden lg:block"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  )
}
