'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/cart-context'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { NotificationCenter } from '@/components/notification-center'
import { Menu, ShoppingBag, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#featured', label: 'Featured' },
  { href: '#products', label: 'Products' },
  { href: '#contact', label: 'Contact' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const { totalItems } = useCart()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)

      const sections = navLinks.map(link => link.href.replace('#', ''))
      for (const section of sections.reverse()) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.replace('#', ''))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-card/95 backdrop-blur-md shadow-lg py-3'
          : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <span className="text-primary-foreground text-lg font-bold">2</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">2M&apos;s Bakery</span>
          </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300',
                activeSection === link.href.replace('#', '')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-primary/5 hover:text-primary'
              )}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <NotificationCenter />

          <Button
            size="sm"
            onClick={() => scrollToSection('#products')}
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Order Now
          </Button>

          <Link href="/checkout">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map(link => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className={cn(
                      'text-lg font-medium text-left transition-colors hover:text-primary',
                      activeSection === link.href.replace('#', '')
                        ? 'text-primary'
                        : 'text-foreground'
                    )}
                  >
                    {link.label}
                  </button>
                ))}
                <hr className="border-border" />
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="text-lg font-medium text-foreground hover:text-primary">
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="text-lg font-medium text-left text-foreground hover:text-primary"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="text-lg font-medium text-foreground hover:text-primary">
                    Login
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
