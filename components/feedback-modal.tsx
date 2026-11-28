'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Order } from '@/lib/types'
import { useStore } from '@/context/store-context'
import { cn } from '@/lib/utils'

// Ratings at or below this need a reason (also enforced by the API).
const LOW_RATING = 2

interface FeedbackModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

// Only shown to signed-in customers: feedback is tied to the account that
// placed the order.
export function FeedbackModal({ order, isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReasonError, setShowReasonError] = useState(false)
  const { addFeedback } = useStore()
  const needsReason = rating <= LOW_RATING

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (needsReason && !comment.trim()) {
      setShowReasonError(true)
      return
    }
    setIsSubmitting(true)

    const { ok, error } = await addFeedback({ orderId: order.id, rating, comment })
    setIsSubmitting(false)

    if (!ok) {
      toast.error(error || "We couldn't save your feedback. Please try again.")
      return
    }

    toast.success('Thanks for your feedback!')
    setRating(5)
    setComment('')
    setShowReasonError(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-foreground">
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>How would you rate your order?</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div role="radiogroup" aria-label="Rating" className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === rating}
                aria-label={`${star} star${star === 1 ? '' : 's'}`}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-8 w-8',
                    star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="feedback-comment" className="text-sm text-muted-foreground mb-2">
              {needsReason ? (
                <>
                  What went wrong? <span className="text-destructive">(Required)</span>
                </>
              ) : (
                'Additional Comments (Optional)'
              )}
            </Label>
            <Textarea
              id="feedback-comment"
              value={comment}
              onChange={e => {
                setComment(e.target.value)
                if (e.target.value.trim()) setShowReasonError(false)
              }}
              placeholder={
                needsReason
                  ? 'Please tell us the reason for your rating so we can improve...'
                  : 'Tell us about your experience...'
              }
              maxLength={1000}
              rows={4}
              required={needsReason}
              aria-invalid={showReasonError}
              aria-describedby={showReasonError ? 'feedback-reason-error' : undefined}
              className={cn('resize-none bg-card', showReasonError && 'border-destructive focus-visible:ring-destructive')}
            />
            {showReasonError && (
              <p id="feedback-reason-error" role="alert" className="mt-1.5 text-sm text-destructive">
                Please give a reason for a {rating}-star rating.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Skip
            </Button>
            <Button type="submit" disabled={isSubmitting || (needsReason && !comment.trim())} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
