'use client'

import { useState } from 'react'
import { useStore } from '@/context/store-context'
import { useAuth } from '@/context/auth-context'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Bell, ShoppingBag, Truck, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OrderNotifications() {
  const { user } = useAuth()
  const { orders } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  // Get orders for current user
  const userOrders = user
    ? orders.filter(o => o.customerEmail === user.email)
    : []

  const unreadCount = userOrders.filter(o => o.status !== 'completed').length

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 bg-card p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-foreground">Order History</SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">Your recent orders</SheetDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
            {userOrders.length === 0 ? (
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
                          ${order.total.toFixed(2)}
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
            )}
          </div>

          {userOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Showing {userOrders.length} order{userOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
