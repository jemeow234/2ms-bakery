import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, serverError } from '@/lib/api'
import { updateProductSchema } from '@/lib/product-schema'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const parsed = updateProductSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check the name, price and category.' }, { status: 400 })
    }

    const { data, error } = await admin.supabase
      .from('products')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error) {
    return serverError('admin/products', error, "Couldn't update the product.")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const { error } = await admin.supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('admin/products', error, "Couldn't delete the product.")
  }
}
