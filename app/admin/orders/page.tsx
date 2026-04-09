'use client'

import { useState } from 'react'
import { useStore } from '@/context/store-context'
import { Order } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Eye,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-orange-500/10 text-orange-600', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500/10 text-blue-600', icon: Truck },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
}

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus)
    toast.success(`Order status updated to ${newStatus}`)
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const processingCount = orders.filter(o => o.status === 'processing').length
  const completedCount = orders.filter(o => o.status === 'completed').length
  const todayRevenue = orders
    .filter(o => {
      const orderDate = new Date(o.createdAt).toDateString()
      return orderDate === new Date().toDateString() && o.status === 'completed'
    })
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track all orders</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{processingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <Package className="h-4 w-4" />
              Today&apos;s Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${todayRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Items</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Total</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const StatusIcon = statusConfig[order.status].icon
                  return (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="py-4 px-6">
                        <span className="font-mono font-medium text-foreground">{order.id}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-foreground">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail || 'Walk-in'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-muted-foreground">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-foreground">${order.total.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                          statusConfig[order.status].color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status].label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-muted-foreground text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Select
                              value={order.status}
                              onValueChange={(value: Order['status']) =>
                                handleStatusChange(order.id, value)
                              }
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-bold text-foreground">{selectedOrder.id}</p>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  statusConfig[selectedOrder.status].color
                )}>
                  {statusConfig[selectedOrder.status].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="font-medium text-foreground capitalize">
                    {selectedOrder.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{selectedOrder.address}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.product.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-foreground">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-lg font-medium text-foreground">Total</span>
                <span className="font-serif text-2xl font-bold text-primary">
                  ${selectedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
