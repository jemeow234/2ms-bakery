import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { serverError } from '@/lib/api'

const feedbackSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default(''),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to leave feedback.' }, { status: 401 })
    }

    const parsed = feedbackSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please choose a rating from 1 to 5.' }, { status: 400 })
    }
    const { orderId, rating, comment } = parsed.data

    // RLS only accepts feedback on an order that belongs to the caller.
    const { data, error } = await supabase
      .from('order_feedback')
      .insert({ order_id: orderId, user_id: user.id, rating, comment })
      .select()
      .single()

    if (error?.code === '42501') {
      return NextResponse.json({ error: 'You can only rate your own orders.' }, { status: 403 })
    }
    if (error) throw error

    return NextResponse.json({
      feedback: {
        id: data.id,
        orderId: data.order_id,
        userId: data.user_id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    return serverError('feedback', error, "We couldn't save your feedback. Please try again.")
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
      .from('order_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return serverError('feedback', error, "Couldn't load your feedback.")
  }
}
