import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Store, Truck, XCircle } from 'lucide-react'
import { LogoMark } from '@/components/logo-mark'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { BAKERY_ORIGIN, formatSchedule } from '@/lib/delivery'
import { ORDER_STATUS_LABELS, shortOrderNumber } from '@/lib/orders'
import { cn, formatPaymentMethod } from '@/lib/utils'
import type { Order } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Order status',
  robots: { index: false, follow: false },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STEPS: Order['status'][] = ['pending', 'processing', 'completed']

interface TrackedOrder {
  id: string
  status: Order['status']
  created_at: string
  delivery_type: Order['deliveryType']
  delivery_date: string | null
  delivery_session: string | null
  payment_method: string
  total: number | string
  order_items: { product_name: string; quantity: number; price: number | string }[] | null
}

/**
 * The order's tracking page. Anyone holding the link can open it — that's
 * how guests check on an order — so the order id (a random UUID) is the key,
 * and the page shows nothing personal: no name, phone, email or address.
 */
export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()

  // Guests have no session for row-level security to recognise, so this
  // reads with the service role and selects only the safe columns.
  const { data, error } = await createAdminClient()
    .from('orders')
    .select(`
      id, status, created_at, delivery_type, delivery_date, delivery_session,
      payment_method, total,
      order_items ( product_name, quantity, price )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) notFound()

  const order = data as TrackedOrder
  const schedule = formatSchedule(order.delivery_date, order.delivery_session)
  const reachedStep = STEPS.indexOf(order.status)

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

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Order #{shortOrderNumber(order.id)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Placed{' '}
              {new Date(order.created_at).toLocaleString('en-PH', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Manila',
              })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <section aria-label="Progress" className="bg-card rounded-xl border border-border p-5">
          {order.status === 'cancelled' ? (
            <p className="flex items-center gap-2 text-destructive font-medium">
              <XCircle className="h-5 w-5" />
              This order was cancelled. Contact us if you have any questions about it.
            </p>
          ) : (
            <ol className="flex items-center gap-2">
              {STEPS.map((step, index) => {
                const done = index <= reachedStep
                return (
                  <li key={step} className="flex-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold',
                        done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className={cn('text-sm', done ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {ORDER_STATUS_LABELS[step]}
                      {index === reachedStep && <span className="sr-only"> (current)</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section className="bg-card rounded-xl border border-border p-5 space-y-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            {order.delivery_type === 'delivery' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            {order.delivery_type === 'delivery' ? 'Delivery' : 'Pick-up'}
          </h2>
          {schedule && <p className="text-sm text-foreground">{schedule}</p>}
          {order.delivery_type === 'pickup' && (
            <p className="text-sm text-muted-foreground">{BAKERY_ORIGIN.address}</p>
          )}
          <p className="text-sm text-muted-foreground">Payment: {formatPaymentMethod(order.payment_method)}</p>
        </section>

        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3">Items</h2>
          <ul className="divide-y divide-border">
            {(order.order_items ?? []).map((item, index) => (
              <li key={index} className="flex justify-between gap-4 py-2 text-sm">
                <span className="text-foreground">
                  {item.quantity}× {item.product_name}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  ₱{(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between pt-3 mt-1 border-t border-border font-semibold text-foreground">
            <span>Total</span>
            <span>₱{Number(order.total).toFixed(2)}</span>
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          Keep this page&apos;s link to check on your order. Anyone with the link can see this page,
          but not your name or contact details.
        </p>
      </main>
    </div>
  )
}
