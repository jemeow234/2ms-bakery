import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAYMENT_PROOF_BUCKET } from '@/lib/payment'
import { requireAdmin, serverError } from '@/lib/api'
import { mapOrderRow, type OrderRow } from '@/lib/orders'

const PAGE_SIZE = 1000

export async function GET() {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response
    const { supabase } = admin

    // Supabase returns at most 1,000 rows per request, so a plain select would
    // silently drop older orders from the orders page and the reports.
    const data: (OrderRow & { payment_proof: string | null })[] = []
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw error
      data.push(...(page ?? []))
      if (!page || page.length < PAGE_SIZE) break
    }

    // The bucket is private, so hand the admin page short-lived links instead.
    const proofPaths = data
      .map(order => order.payment_proof)
      .filter((path): path is string => Boolean(path))
    const proofUrls = new Map<string, string>()
    if (proofPaths.length > 0) {
      const { data: signed } = await createAdminClient()
        .storage.from(PAYMENT_PROOF_BUCKET)
        .createSignedUrls(proofPaths, 60 * 60)
      for (const s of signed || []) {
        if (s.path && s.signedUrl) proofUrls.set(s.path, s.signedUrl)
      }
    }

    const orders = data.map(order => ({
      ...mapOrderRow(order),
      paymentProofUrl: order.payment_proof ? proofUrls.get(order.payment_proof) : undefined,
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    return serverError('admin/orders', error, "Couldn't load orders.")
  }
}
