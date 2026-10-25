'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, MessageSquare, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { shortOrderNumber } from '@/lib/orders'
import type { OrderFeedback } from '@/lib/types'

interface AdminFeedback extends OrderFeedback {
  customerName: string
  customerEmail: string
  orderTotal: number | null
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn('flex gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn('h-4 w-4', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
        />
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<AdminFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const res = await fetch('/api/admin/feedback')
        if (res.ok) {
          const data = await res.json()
          setFeedback(data.feedback || [])
        } else {
          toast.error('Failed to load feedback')
        }
      } catch (error) {
        console.error('Failed to load feedback:', error)
        toast.error('Failed to load feedback')
      } finally {
        setIsLoading(false)
      }
    }
    loadFeedback()
  }, [])

  const stats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    let sum = 0
    for (const f of feedback) {
      counts[f.rating - 1]++
      sum += f.rating
    }
    return {
      total: feedback.length,
      average: feedback.length ? sum / feedback.length : 0,
      withComments: feedback.filter(f => f.comment.trim()).length,
      counts,
    }
  }, [feedback])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return feedback.filter(f =>
      (ratingFilter === null || f.rating === ratingFilter) &&
      (!term ||
        f.comment.toLowerCase().includes(term) ||
        f.customerName.toLowerCase().includes(term) ||
        f.customerEmail.toLowerCase().includes(term) ||
        shortOrderNumber(f.orderId).toLowerCase().includes(term))
    )
  }, [feedback, ratingFilter, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Customer Feedback</h1>
        <p className="text-muted-foreground mt-1">Ratings and comments customers leave after ordering</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Average Rating</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-bold text-primary">{stats.total ? stats.average.toFixed(1) : '—'}</p>
            {stats.total > 0 && <Stars rating={Math.round(stats.average)} />}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Reviews</p>
          <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">With Comments</p>
          <p className="text-3xl font-bold text-primary mt-2">{stats.withComments}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border border-border',
              ratingFilter === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground hover:bg-secondary'
            )}
          >
            All ({stats.total})
          </button>
          {[5, 4, 3, 2, 1].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRatingFilter(n)}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-border',
                ratingFilter === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground hover:bg-secondary'
              )}
            >
              {n} <Star className="h-3 w-3 fill-current" /> ({stats.counts[n - 1]})
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search comment, customer, order #..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Feedback list */}
      {isLoading ? (
        <div className="bg-card rounded-xl border border-border py-12 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-12 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {feedback.length === 0 ? 'No feedback yet' : 'No feedback matches these filters'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(f => (
            <div key={f.id} className="bg-card rounded-xl border border-border p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{f.customerName || 'Customer'}</p>
                  {f.customerEmail && (
                    <p className="text-xs text-muted-foreground truncate">{f.customerEmail}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Stars rating={f.rating} />
                  <span className="text-xs text-muted-foreground">{formatDate(f.createdAt)}</span>
                </div>
              </div>
              {f.comment.trim() ? (
                <p className="mt-3 text-sm text-foreground whitespace-pre-wrap break-words">{f.comment}</p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground italic">No comment</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground font-mono">Order #{shortOrderNumber(f.orderId)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
