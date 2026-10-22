import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, serverError } from '@/lib/api'
import { createProductSchema } from '@/lib/product-schema'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { data, error } = await admin.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return serverError('admin/products', error, "Couldn't load products.")
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const parsed = createProductSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the name, price, category and stock.' },
        { status: 400 }
      )
    }

    const { data, error } = await admin.supabase
      .from('products')
      .insert(parsed.data)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error) {
    return serverError('admin/products', error, "Couldn't add the product.")
  }
}
