import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, serverError } from '@/lib/api'
import { toAnnouncement, type AnnouncementRow } from '@/lib/announcements'

const announcementSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
    image: z.url().max(2048).optional(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }).optional(),
  })
  .refine(a => !a.endsAt || new Date(a.endsAt) > new Date(a.startsAt), {
    message: 'The end date must be after the start date.',
  })

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { data, error } = await admin.supabase
      .from('announcements')
      .select('*')
      .order('starts_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as AnnouncementRow[]
    const creatorIds = [...new Set(rows.map(a => a.created_by).filter((id): id is string => Boolean(id)))]
    const nameById = new Map<string, string>()
    if (creatorIds.length > 0) {
      const { data: creators } = await admin.supabase.from('users').select('id, name').in('id', creatorIds)
      for (const c of creators || []) nameById.set(c.id, c.name)
    }

    return NextResponse.json({
      announcements: rows.map(a => toAnnouncement(a, (a.created_by && nameById.get(a.created_by)) || 'Admin')),
    })
  } catch (error) {
    return serverError('admin/announcements', error, "Couldn't load announcements.")
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response
    const { supabase, user, profile } = admin

    const parsed = announcementSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      const windowError = parsed.error.issues.find(i => i.message.startsWith('The end date'))
      return NextResponse.json(
        { error: windowError?.message ?? 'Please add a title, a message (up to 5,000 characters) and a start date.' },
        { status: 400 }
      )
    }
    const { title, message, image, startsAt, endsAt } = parsed.data

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        message,
        type: 'announcement',
        image: image || null,
        starts_at: startsAt,
        ends_at: endsAt ?? null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // We already know the poster's name from the admin check — no need
    // for a follow-up lookup for the item we just created.
    return NextResponse.json({ announcement: toAnnouncement(data as AnnouncementRow, profile.name || 'Admin') })
  } catch (error) {
    return serverError('admin/announcements', error, "Couldn't post the announcement.")
  }
}
