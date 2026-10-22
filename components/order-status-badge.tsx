import { cn } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/lib/orders'
import type { Order } from '@/lib/types'

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'text-yellow-800 bg-yellow-100',
  processing: 'text-blue-800 bg-blue-100',
  completed: 'text-green-800 bg-green-100',
  cancelled: 'text-red-800 bg-red-100',
}

export function OrderStatusBadge({ status, className }: { status: Order['status']; className?: string }) {
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap', STATUS_COLORS[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
