'use client'

import { useState } from 'react'
import { useStore } from '@/context/store-context'
import { useAuth } from '@/context/auth-context'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, ShoppingBag, Check, X } from 'lucide-react'
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
        return 'text-green-600 bg-green-50'
      case 'processing':
        return 'text-blue-600 bg-blue-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
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

      <SheetContent side="right" className="w-full sm:w-96 bg-card">
        <div className="flex flex-col h-full">
          <div className="pb-4 border-b border-border">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order History
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Your recent orders</p>
          </div>

          <div className="flex-1 overflow-auto mt-4 space-y-3">
            {userOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              userOrders
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(order => (
                  <Card key={order.id} className="border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Order #{order.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm font-medium text-foreground">
                            ${order.total.toFixed(2)}
                          </p>
                        </div>
                        <span className={cn('px-2 py-1 rounded text-xs font-medium capitalize', getStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" />
                        <span>{order.items.length} item(s)</span>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <p className="text-muted-foreground">{order.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pick-up'}</p>
                        {order.deliveryType === 'delivery' && order.distance && (
                          <p className="text-muted-foreground">{order.distance.toFixed(1)} km away</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>

          {userOrders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
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
