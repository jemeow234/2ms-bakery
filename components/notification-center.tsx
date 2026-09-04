'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/context/store-context'
import { useAuth } from '@/context/auth-context'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Bell, ShoppingBag, Truck, Store, Clock, Mail, Megaphone, MessageSquare, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'orders' | 'announcements'

const LAST_SEEN_KEY = 'bakery-last-seen-announcement-at'

export function NotificationCenter() {
  const { user } = useAuth()
  const { orders, announcements } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>(user ? 'orders' : 'announcements')
  const [lastSeenAnnouncementAt, setLastSeenAnnouncementAt] = useState<string | null>(null)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is SSR-unsafe, must read client-side
      setLastSeenAnnouncementAt(localStorage.getItem(LAST_SEEN_KEY))
    } catch {
      // localStorage unavailable (private browsing, etc.) — treat everything as unseen
    }
  }, [])

  const userOrders = user ? orders.filter(o => o.customerEmail === user.email) : []
  const unreadOrders = userOrders.filter(o => o.status !== 'completed').length
  const unseenAnnouncements = announcements.filter(a =>
    !lastSeenAnnouncementAt || new Date(a.createdAt).getTime() > new Date(lastSeenAnnouncementAt).getTime()
  ).length
  const totalUnread = unreadOrders + unseenAnnouncements

  const markAnnouncementsSeen = () => {
    const latest = announcements[0]?.createdAt
    if (!latest) return
    try {
      localStorage.setItem(LAST_SEEN_KEY, latest)
    } catch {
      // ignore write failures — worst case the badge stays until next successful write
    }
    setLastSeenAnnouncementAt(latest)
  }

  const handleTabChange = (next: Tab) => {
    setTab(next)
    if (next === 'announcements') {
      markAnnouncementsSeen()
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && tab === 'announcements') {
      markAnnouncementsSeen()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100'
      case 'processing':
        return 'text-blue-700 bg-blue-100'
      case 'pending':
        return 'text-yellow-700 bg-yellow-100'
      case 'cancelled':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const handleBrowseMenu = () => {
    setIsOpen(false)
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 bg-card p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4 border-b border-border">
            <SheetTitle className="text-lg font-bold text-foreground">Notifications</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Your orders and the latest from 2M&apos;s Bakery
            </SheetDescription>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 px-6 pt-4">
            <button
              onClick={() => handleTabChange('orders')}
              className={cn(
                'relative flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                tab === 'orders'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <Clock className="h-4 w-4" />
              Orders
              {unreadOrders > 0 && (
                <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('announcements')}
              className={cn(
                'relative flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                tab === 'announcements'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <Mail className="h-4 w-4" />
              News
              {unseenAnnouncements > 0 && (
                <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
            {tab === 'orders' ? (
              !user ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <LogIn className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Log in to see your orders</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your order history shows up here once you&apos;re signed in.
                  </p>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Log In
                    </Button>
                  </Link>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium mb-1">No orders yet</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your order history will show up here.
                  </p>
                  <Button
                    onClick={handleBrowseMenu}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Browse Menu
                  </Button>
                </div>
              ) : (
                userOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(order => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Order #{order.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm font-bold text-foreground">
                            ₱{order.total.toFixed(2)}
                          </p>
                        </div>
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', getStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <div className="flex items-center gap-2 text-muted-foreground text-xs mt-3">
                        <ShoppingBag className="h-4 w-4" />
                        <span>{order.items.length} item(s)</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2 pt-3 border-t border-border">
                        {order.deliveryType === 'delivery' ? (
                          <Truck className="h-4 w-4" />
                        ) : (
                          <Store className="h-4 w-4" />
                        )}
                        <span>
                          {order.deliveryType === 'delivery' ? 'Delivery' : 'Pick-up'}
                          {order.deliveryType === 'delivery' && order.distance && ` · ${order.distance.toFixed(1)} km away`}
                        </span>
                      </div>
                    </div>
                  ))
              )
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">No news yet</p>
                <p className="text-sm text-muted-foreground">
                  Announcements and offers will show up here.
                </p>
              </div>
            ) : (
              announcements.map(announcement => (
                <div
                  key={announcement.id}
                  className="rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5',
                      announcement.type === 'announcement'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    )}>
                      {announcement.type === 'announcement' ? (
                        <MessageSquare className="h-3 w-3" />
                      ) : (
                        <Megaphone className="h-3 w-3" />
                      )}
                      {announcement.type === 'announcement' ? 'Announcement' : 'Offer'}
                    </div>
                  </div>
                  {announcement.image && (
                    <img
                      src={announcement.image}
                      alt={announcement.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <p className="text-sm font-bold text-foreground mb-1">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.message}</p>
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
