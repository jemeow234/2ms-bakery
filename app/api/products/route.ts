import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { serverError } from '@/lib/api'

export async function GET() {
  try {
    const supabase = await createClient()

    // Same order as the server-rendered home page, so the live list doesn't
    // reshuffle when it replaces the prerendered one.
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({ products: data })
  } catch (error) {
    return serverError('products', error, "Couldn't load products.")
  }
}
