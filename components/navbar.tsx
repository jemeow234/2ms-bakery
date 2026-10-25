'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/cart-context'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { NotificationCenter } from '@/components/notification-center'
import { ClipboardList, Menu, ShoppingBag, User, UserCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#featured', label: 'Featured' },
  { href: '#products', label: 'Products' },
  { href: '#contact', label: 'Contact' },
]

const mobileLinkClass =
  'block w-full rounded-lg px-3 py-3 text-base font-medium text-left transition-colors hover:bg-primary/5 hover:text-primary'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
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
    setMenuOpen(false)
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
          : 'bg-transparent py-4 sm:py-6'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Image
                src="/images/2mslogo-mark.png"
                alt=""
                width={80}
                height={80}
                priority
                className="w-full h-full object-cover"
              />
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
          <Link
            href="/special-order"
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 text-foreground hover:bg-primary/5 hover:text-primary"
          >
            Special Order
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          <NotificationCenter />

          <Button
            asChild
            size="sm"
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link href={user ? '/profile' : '/login?next=/profile'}>
              <UserCircle className="h-4 w-4" />
              Profile
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link
              href="/checkout"
              aria-label={totalItems > 0 ? `Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}` : 'Cart'}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span aria-hidden="true" className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                  <Link href="/admin">Dashboard</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link href="/orders" aria-label="My orders">
                  <ClipboardList className="h-5 w-5" />
                </Link>
              </Button>
              <Button aria-label="Log out" variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost" size="icon">
              <Link href="/login" aria-label="Log in">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button aria-label="Open menu" variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs bg-card gap-0 overflow-y-auto">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-6 pt-5 pb-4 pr-12 border-b border-border"
              >
                <Image src="/images/2mslogo-mark.png" alt="" width={64} height={64} className="w-8 h-8 rounded-full" />
                <span className="text-base font-bold tracking-tight text-foreground">2M&apos;s Bakery</span>
              </Link>
              <div className="flex flex-col gap-1 px-3 py-4">
                {navLinks.map(link => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className={cn(
                      mobileLinkClass,
                      activeSection === link.href.replace('#', '')
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground'
                    )}
                  >
                    {link.label}
                  </button>
                ))}
                <Link href="/special-order" onClick={() => setMenuOpen(false)} className={cn(mobileLinkClass, 'text-foreground')}>
                  Special Order
                </Link>
                <hr className="border-border my-2 mx-3" />
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)} className={cn(mobileLinkClass, 'text-foreground')}>
                        Admin Dashboard
                      </Link>
                    )}
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className={cn(mobileLinkClass, 'text-foreground')}>
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                      }}
                      className={cn(mobileLinkClass, 'text-foreground')}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className={cn(mobileLinkClass, 'text-foreground')}>
                    Login
                  </Link>
                )}
              </div>
              <div className="mt-auto px-6 pb-6">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href={user ? '/profile' : '/login?next=/profile'} onClick={() => setMenuOpen(false)}>
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
