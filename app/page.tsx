import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/sections/hero-section'
import { AboutSection } from '@/components/sections/about-section'
import { FeaturedSection } from '@/components/sections/featured-section'
import { ProductsSection } from '@/components/sections/products-section'
import { ContactSection } from '@/components/sections/contact-section'
import { Footer } from '@/components/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedSection />
      <ProductsSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
