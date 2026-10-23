import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, serverError } from '@/lib/api'

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  type: z.enum(['announcement', 'advertisement']),
  image: z.string().trim().max(2048).optional(),
})

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { data, error } = await admin.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ announcements: data })
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
      return NextResponse.json(
        { error: 'Please add a title and a message (up to 5,000 characters).' },
        { status: 400 }
      )
    }
    const { title, message, type, image } = parsed.data

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        message,
        type,
        image: image || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      announcement: {
        id: data.id,
        title: data.title,
        message: data.message,
        type: data.type,
        image: data.image ?? undefined,
        createdAt: data.created_at,
        // We already know the poster's name from the admin check — no need
        // for a follow-up lookup for the item we just created.
        createdBy: profile.name || 'Admin',
      },
    })
  } catch (error) {
    return serverError('admin/announcements', error, "Couldn't post the announcement.")
  }
}
