import type { Announcement } from '@/lib/types'

export interface AnnouncementRow {
  id: string
  title: string
  message: string
  image: string | null
  starts_at: string
  ends_at: string | null
  created_by: string | null
  created_at: string
}

export function toAnnouncement(row: AnnouncementRow, createdBy: string): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    image: row.image ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    createdAt: row.created_at,
    createdBy,
  }
}

export type AnnouncementStatus = 'scheduled' | 'active' | 'expired'

export function announcementStatus(a: Pick<Announcement, 'startsAt' | 'endsAt'>, now = Date.now()): AnnouncementStatus {
  if (new Date(a.startsAt).getTime() > now) return 'scheduled'
  if (a.endsAt && new Date(a.endsAt).getTime() <= now) return 'expired'
  return 'active'
}
