import type { Order } from '@/lib/types'

/** An `orders` row as selected with its `order_items`. */
export interface OrderItemRow {
  product_id: string | null
  product_name: string
  quantity: number
  price: number | string
}

export interface OrderRow {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  address: string | null
  delivery_type: Order['deliveryType']
  status: Order['status']
  created_at: string
  payment_method: Order['paymentMethod']
  total: number | string
  distance: number | string | null
  delivery_date: string | null
  delivery_session: string | null
  order_items?: OrderItemRow[] | null
}

/**
 * The browser's shape of an order. Line items carry the price and name they
 * were sold at, which may differ from today's catalog.
 */
export function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    items: (row.order_items ?? []).map(item => ({
      product: {
        id: item.product_id ?? '',
        name: item.product_name,
        price: Number(item.price),
      } as Order['items'][number]['product'],
      quantity: item.quantity,
    })),
    total: Number(row.total),
    customerName: row.customer_name ?? '',
    customerEmail: row.customer_email ?? '',
    customerPhone: row.customer_phone ?? '',
    address: row.address ?? '',
    deliveryType: row.delivery_type,
    status: row.status,
    createdAt: row.created_at,
    paymentMethod: row.payment_method,
    distance: row.distance != null ? Number(row.distance) : undefined,
    deliveryDate: row.delivery_date ?? undefined,
    deliverySession: row.delivery_session ?? undefined,
  }
}

/** The six-character order number customers see on receipts. */
export function shortOrderNumber(id: string): string {
  return id.slice(-6).toUpperCase()
}

export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Received',
  processing: 'Being prepared',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
