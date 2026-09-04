'use client'

import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

const footerLinks = {
  shop: [
    { label: 'All Products', href: '#products', category: 'all' },
    { label: 'Breads', href: '#products', category: 'bread' },
    { label: 'Pastries', href: '#products', category: 'pastry' },
    { label: 'Cakes', href: '#products', category: 'cake' },
  ],
  company: [
    { label: 'About Us', href: '#about' },
    { label: 'Our Story', href: '#about' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  support: [
    { label: 'Contact', href: '#contact' },
    { label: 'FAQ', href: '#' },
    { label: 'Shipping', href: '#' },
    { label: 'Returns', href: '#' },
  ],
}

export function Footer() {
  const handleShopLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, category: string) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('products-category-select', { detail: { category } }))
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xl font-bold">2</span>
              </div>
              <span className="text-xl font-bold">2M&apos;s Bakery</span>
            </Link>
            <p className="text-background/70 mb-6 max-w-sm text-pretty">
              Handcrafted artisan breads and pastries made with love. 
              Fresh from our ovens to your table since 2010.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={e => handleShopLinkClick(e, link.category)}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            &copy; {new Date().getFullYear()} Golden Crust Bakery. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
