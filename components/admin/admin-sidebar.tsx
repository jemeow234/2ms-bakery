'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  LogOut,
  Home,
  Users,
  Megaphone,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/logo-mark'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pos', label: 'POS System', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
]

// Shared by the fixed desktop sidebar and the slide-out phone menu.
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    onNavigate?.()
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <LogoMark className="w-11 h-11" priority />
          <div>
            <span className="text-lg font-bold block">2M&apos;s Bakery</span>
            <span className="text-xs text-sidebar-foreground/70">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin" className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Back to Store</span>
        </Link>

        <div className="px-4 py-3">
          <p className="text-sm text-sidebar-foreground/70">Logged in as</p>
          <p className="font-medium text-sidebar-foreground truncate">{user?.name}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-all w-full"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  )
}

/** Fixed sidebar from the md breakpoint up. */
export function AdminSidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex-col">
      <SidebarContent />
    </aside>
  )
}

/** Top bar with a slide-out menu below the md breakpoint. */
export function AdminMobileBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
      <Link href="/admin" className="flex items-center gap-2">
        <LogoMark className="w-8 h-8" />
        <span className="font-bold text-foreground">Admin Panel</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open admin menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 gap-0 bg-sidebar text-sidebar-foreground flex flex-col">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
