import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { serverError } from '@/lib/api'

// Email belongs to Supabase Auth and the role to admins; neither is set here.
const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = profileSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check your name, phone and address.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(parsed.data)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return serverError('users/profile', error, "Couldn't save your profile.")
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return serverError('users/profile', error, "Couldn't load your profile.")
  }
}
