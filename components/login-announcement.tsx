'use client'

import { useState } from 'react'
import { AnnouncementModal } from '@/components/announcement-modal'
import { useAuth } from '@/context/auth-context'

// Shows the latest announcement once per sign-in.
export function LoginAnnouncement() {
  const { user } = useAuth()
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [shownForUserId, setShownForUserId] = useState<string | null>(null)

  if (user && shownForUserId !== user.id) {
    setShownForUserId(user.id)
    setShowAnnouncement(true)
  }

  return <AnnouncementModal isOpen={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
}
