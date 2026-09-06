'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/context/store-context'

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const { announcements } = useStore()
  const announcement = announcements[0] ?? null

  if (!isOpen || !announcement) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-lg max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-serif font-bold text-foreground">
            {announcement.type === 'announcement' ? '📢 Announcement' : '🎉 Special Offer'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {announcement.image && (
            <img 
              src={announcement.image} 
              alt={announcement.title}
              className="w-full h-40 object-cover rounded-lg"
            />
          )}

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {announcement.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {announcement.message}
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  )
}
