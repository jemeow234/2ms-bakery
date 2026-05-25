'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/sections/hero-section'
import { AboutSection } from '@/components/sections/about-section'
import { FeaturedSection } from '@/components/sections/featured-section'
import { ProductsSection } from '@/components/sections/products-section'
import { ContactSection } from '@/components/sections/contact-section'
import { Footer } from '@/components/footer'
import { AnnouncementModal } from '@/components/announcement-modal'
import { useAuth } from '@/context/auth-context'

export default function HomePage() {
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const { user } = useAuth()
  const [hasShownToday, setHasShownToday] = useState(false)

  useEffect(() => {
    // Show announcement modal on login (once per session)
    if (user && !hasShownToday) {
      setShowAnnouncement(true)
      setHasShownToday(true)
    }
  }, [user, hasShownToday])

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedSection />
      <ProductsSection />
      <ContactSection />
      <Footer />
      <AnnouncementModal isOpen={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
    </main>
  )
}
