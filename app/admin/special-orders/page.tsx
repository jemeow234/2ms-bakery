'use client'

import { useEffect, useState } from 'react'
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
  Search,
  Inbox,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Mail,
  Phone,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type SpecialOrderStatus = 'new' | 'confirmed' | 'completed' | 'declined'

interface SpecialOrder {
  id: string
  name: string
  email: string
  phone: string
  product: string
  quantity: number
  // Numeric columns can arrive as strings; null for items not on the menu.
  unit_price: number | string | null
  needed_by: string
  fulfillment: 'pickup' | 'delivery'
  notes: string
  status: SpecialOrderStatus
  created_at: string
}

const statusConfig: Record<SpecialOrderStatus, { label: string; color: string; icon: typeof Sparkles }> = {
  new: { label: 'New', color: 'bg-orange-500/10 text-orange-600', icon: Sparkles },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-600', icon: CalendarClock },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'bg-destructive/10 text-destructive', icon: XCircle },
}

/** 'YYYY-MM-DD' as a readable date, without shifting it by the viewer's time zone. */
function formatNeededBy(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function SpecialOrdersPage() {
  const [orders, setOrders] = useState<SpecialOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Bumped by the Refresh button to fetch again.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch('/api/admin/special-orders')
        const body = await res.json()
        if (!res.ok) throw new Error(body.error)
        setOrders(body.specialOrders)
      } catch {
        toast.error("Couldn't load special orders. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [reloadKey])

  const loadOrders = () => {
    setIsLoading(true)
    setReloadKey(key => key + 1)
  }

  const handleStatusChange = async (id: string, status: SpecialOrderStatus) => {
    const res = await fetch(`/api/admin/special-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast.error('Failed to update the request. Please try again.')
      return
    }
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
    toast.success(`Marked as ${statusConfig[status].label.toLowerCase()}`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this special order request?')) return
    const res = await fetch(`/api/admin/special-orders/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete the request. Please try again.')
      return
    }
    setOrders(prev => prev.filter(o => o.id !== id))
    toast.success('Request deleted')
  }

  const query = search.toLowerCase()
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.name.toLowerCase().includes(query) ||
      order.email.toLowerCase().includes(query) ||
      order.product.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const countOf = (status: SpecialOrderStatus) => orders.filter(o => o.status === status).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Special Orders</h1>
          <p className="text-muted-foreground mt-1">Bulk order requests from customers</p>
        </div>
        <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(statusConfig) as SpecialOrderStatus[]).map(status => (
          <div key={status} className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{statusConfig[status].label}</p>
            <p className={cn('text-3xl font-bold mt-2', statusConfig[status].color.split(' ')[1])}>
              {countOf(status)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or item..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            {(Object.keys(statusConfig) as SpecialOrderStatus[]).map(status => (
              <SelectItem key={status} value={status}>{statusConfig[status].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Requests */}
      {isLoading && orders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No special order requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const StatusIcon = statusConfig[order.status].icon
            return (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                        statusConfig[order.status].color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[order.status].label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Requested {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-foreground text-lg">
                      {order.quantity.toLocaleString()} pcs × {order.product}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Estimated total: </span>
                        {order.unit_price === null ? (
                          <span className="text-muted-foreground">To be quoted</span>
                        ) : (
                          <span className="font-medium text-foreground">
                            ₱{(Number(order.unit_price) * order.quantity).toFixed(2)}
                            <span className="text-muted-foreground font-normal">
                              {' '}(₱{Number(order.unit_price).toFixed(2)}/pc)
                            </span>
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Needed by: </span>
                        <span className="font-medium text-primary">{formatNeededBy(order.needed_by)}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Fulfillment: </span>
                        <span className="font-medium text-foreground">
                          {order.fulfillment === 'delivery' ? 'Delivery' : 'Pick-up'}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Customer: </span>
                        <span className="font-medium text-foreground">{order.name}</span>
                      </p>
                      <p className="flex flex-wrap gap-x-4 gap-y-1">
                        <a href={`mailto:${order.email}`} className="inline-flex items-center gap-1 text-primary hover:underline break-all">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {order.email}
                        </a>
                        <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {order.phone}
                        </a>
                      </p>
                    </div>

                    {order.notes && (
                      <div className="p-3 rounded-lg bg-secondary text-sm text-foreground whitespace-pre-wrap">
                        {order.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Select
                      value={order.status}
                      onValueChange={(value: SpecialOrderStatus) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[140px] h-9" aria-label="Change status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusConfig) as SpecialOrderStatus[]).map(status => (
                          <SelectItem key={status} value={status}>{statusConfig[status].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleDelete(order.id)}
                      variant="outline"
                      size="sm"
                      className="h-9 text-destructive hover:text-destructive"
                      aria-label="Delete request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
