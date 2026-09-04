import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // created_by stores the poster's user id, not a display name —
    // resolve names in one batched lookup rather than per-row.
    const creatorIds = [...new Set((announcements || []).map((a: any) => a.created_by).filter(Boolean))]
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

    const mapped = (announcements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      image: a.image ?? undefined,
      createdAt: a.created_at,
      createdBy: nameById.get(a.created_by) || 'Admin',
    }))

    return NextResponse.json({ announcements: mapped })
  } catch (error) {
    console.error('[v0] Announcements fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}
