import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { LogoMark } from '@/components/logo-mark'
import { BAKERY_ORIGIN } from '@/lib/delivery'
import { SHOP_EMAIL, SHOP_PHONE } from '@/lib/shop'

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <LogoMark className="w-12 h-12" />
              <span className="text-xl font-bold tracking-tight">2M&apos;s Bakery</span>
            </Link>
            <p className="text-background/70 max-w-sm text-pretty">
              Handcrafted artisan breads and pastries made with love.
              Fresh from our ovens to your table since 2010.
            </p>
          </div>

          {/* Contact */}
          <ul className="space-y-2 text-sm text-background/70">
            <li>
              <a href={`mailto:${SHOP_EMAIL}`} className="flex items-center gap-2 hover:text-primary transition-colors break-all">
                <Mail className="h-4 w-4 shrink-0" />
                {SHOP_EMAIL}
              </a>
            </li>
            <li>
              <a href={`tel:${SHOP_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                {SHOP_PHONE}
              </a>
            </li>
            <li className="flex items-start gap-2 max-w-xs">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              {BAKERY_ORIGIN.address}
            </li>
          </ul>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            &copy; {new Date().getFullYear()} 2M&apos;s Bakery. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            <Link href="/faqs" className="hover:text-primary transition-colors">
              FAQs
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
