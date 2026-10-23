import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/sections/hero-section'
import { AboutSection } from '@/components/sections/about-section'
import { FeaturedSection } from '@/components/sections/featured-section'
import { ProductsSection } from '@/components/sections/products-section'
import { ContactSection } from '@/components/sections/contact-section'
import { Footer } from '@/components/footer'
import { LoginAnnouncement } from '@/components/login-announcement'
import { createPublicClient } from '@/lib/supabase/public'
import type { Product } from '@/lib/types'

// The catalog is rendered into the page so search engines and the first
// screen see it; the browser then refreshes it with live stock. Rebuilt at
// most every 5 minutes.
export const revalidate = 300

async function loadProducts(): Promise<Product[]> {
  try {
    const { data, error } = await createPublicClient()
      .from('products')
      .select('*')
      .order('name')
    if (error) throw error
    return (data ?? []) as Product[]
  } catch (error) {
    // The store still loads them in the browser.
    console.error('[home] could not prerender products:', error)
    return []
  }
}

export default async function HomePage() {
  const products = await loadProducts()

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedSection initialProducts={products} />
      <ProductsSection initialProducts={products} />
      <ContactSection />
      <Footer />
      <LoginAnnouncement />
    </main>
  )
}
