'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight, LogIn, ShoppingBag, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo-mark'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { useAuth } from '@/context/auth-context'
import { useStore } from '@/context/store-context'
import { formatSchedule } from '@/lib/delivery'
import { shortOrderNumber } from '@/lib/orders'

export default function MyOrdersPage() {
  const { user, isLoading } = useAuth()
  const { orders } = useStore()

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to the shop</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-9 h-9" priority />
            <span className="text-lg font-bold tracking-tight text-foreground">2M&apos;s Bakery</span>
          </Link>
          <span className="w-24" aria-hidden="true" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-6">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center py-20" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="sr-only">Loading…</span>
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border px-6">
            <LogIn className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">Sign in to see your orders</p>
            <p className="text-sm text-muted-foreground mb-6">
              Ordered as a guest? Use the tracking link from your order confirmation.
            </p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border px-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-6">Your orders will show up here.</p>
            <Button asChild>
              <Link href="/#products">Browse the menu</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {sortedOrders.map(order => {
              const schedule = formatSchedule(order.deliveryDate, order.deliverySession)
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="block bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">Order #{shortOrderNumber(order.id)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-PH', {
                            dateStyle: 'medium',
                            timeZone: 'Asia/Manila',
                          })}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <p className="text-sm text-muted-foreground mt-3 line-clamp-1">
                      {order.items.map(item => `${item.quantity}× ${item.product.name}`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                        {order.deliveryType === 'delivery' ? (
                          <Truck className="h-4 w-4 shrink-0" />
                        ) : (
                          <Store className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">
                          {order.deliveryType === 'delivery' ? 'Delivery' : 'Pick-up'}
                          {schedule ? ` · ${schedule}` : ''}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-foreground whitespace-nowrap">
                        ₱{order.total.toFixed(2)}
                        <span className="sr-only">, {itemCount} items. View order</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
