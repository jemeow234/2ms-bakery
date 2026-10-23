import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError } from '@/lib/api'
import type { Announcement } from '@/lib/types'

interface AnnouncementRow {
  id: string
  title: string
  message: string
  type: Announcement['type']
  image: string | null
  created_by: string | null
  created_at: string
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // created_by stores the poster's user id, not a display name —
    // resolve names in one batched lookup rather than per-row.
    const rows = (announcements ?? []) as AnnouncementRow[]
    const creatorIds = [...new Set(rows.map(a => a.created_by).filter((id): id is string => Boolean(id)))]
    const nameById = new Map<string, string>()
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, name')
        .in('id', creatorIds)
      for (const c of creators || []) {
        nameById.set(c.id, c.name)
      }
    }

    const mapped = rows.map(a => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      image: a.image ?? undefined,
      createdAt: a.created_at,
      createdBy: (a.created_by && nameById.get(a.created_by)) || 'Admin',
    }))

    return NextResponse.json({ announcements: mapped })
  } catch (error) {
    return serverError('announcements', error, 'Failed to fetch announcements')
  }
}
