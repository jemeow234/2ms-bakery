'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/context/store-context'
import { shortOrderNumber } from '@/lib/orders'

// Renders only for the signed-in customer's own pending order: the store holds
// just their orders, so someone else opening the tracking link sees nothing.
// The cancel API enforces the same rule.
export function CancelOrderButton({ orderId, onCancelled }: { orderId: string; onCancelled?: () => void }) {
  const { orders, cancelOrder } = useStore()
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)

  const order = orders.find(o => o.id === orderId)
  if (order?.status !== 'pending') return null

  const handleCancel = async () => {
    const refundNote = order.paymentMethod === 'gcash'
      ? "\n\nYou paid by GCash — we'll contact you about your refund."
      : ''
    if (!window.confirm(`Cancel order #${shortOrderNumber(orderId)}?${refundNote}`)) return

    setIsCancelling(true)
    const { ok, error } = await cancelOrder(orderId)
    setIsCancelling(false)

    if (ok) {
      toast.success('Your order was cancelled.')
      // The tracking page reads the order on the server.
      router.refresh()
      onCancelled?.()
    } else {
      toast.error(error || "We couldn't cancel your order. Please try again.")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isCancelling}
      onClick={handleCancel}
      className="text-destructive hover:text-destructive gap-2"
    >
      {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
      Cancel order
    </Button>
  )
}
