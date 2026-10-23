import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, safeImageExtension, serverError } from '@/lib/api'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response
    const { supabase } = admin

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image must be smaller than 5MB' }, { status: 400 })
    }

    const filePath = `${crypto.randomUUID()}.${safeImageExtension(file)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, { contentType: file.type })

    if (uploadError) {
      return serverError('admin/upload', uploadError, "Couldn't upload the image. Please try again.")
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)

    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    return serverError('admin/upload', error, "Couldn't upload the image. Please try again.")
  }
}
