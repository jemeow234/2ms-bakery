'use client'

import { useState } from 'react'
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
  const [shownForUserId, setShownForUserId] = useState<string | null>(null)

  // Show announcement modal once per login
  if (user && shownForUserId !== user.id) {
    setShownForUserId(user.id)
    setShowAnnouncement(true)
  }

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
