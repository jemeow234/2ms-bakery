'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore } from '@/context/store-context'

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const { announcements } = useStore()
  const announcement = announcements[0] ?? null

  if (!announcement) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <p className="text-sm font-medium text-primary">
            <span aria-hidden="true">{announcement.type === 'announcement' ? '📢 ' : '🎉 '}</span>
            {announcement.type === 'announcement' ? 'Announcement' : 'Special Offer'}
          </p>
          <DialogTitle className="text-xl font-serif font-bold text-foreground">
            {announcement.title}
          </DialogTitle>
        </DialogHeader>

        {announcement.image && (
          // Admin-uploaded image of unknown size; a plain img keeps it simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={announcement.image}
            alt=""
            className="w-full h-40 object-cover rounded-lg"
          />
        )}

        <DialogDescription className="text-sm text-muted-foreground whitespace-pre-wrap">
          {announcement.message}
        </DialogDescription>

        <Button onClick={onClose} className="w-full">
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  )
}
