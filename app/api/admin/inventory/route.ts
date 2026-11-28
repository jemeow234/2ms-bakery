import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, serverError } from '@/lib/api'
import type { InventoryLog } from '@/lib/types'

const LOG_LIMIT = 50
// A date-ranged read (the reports page) can cover a month of sales, more
// than one response holds, so it is read in pages up to a cap.
const RANGE_PAGE_SIZE = 1000
const RANGE_MAX_PAGES = 20

interface InventoryLogRow {
  id: string
  product_id: string | null
  product_name: string
  type: InventoryLog['type']
  quantity: number
  previous_stock: number
  new_stock: number
  note: string | null
  created_at: string
}

// Sales are logged by create_order(); admins add, remove or set a count.
const stockSchema = z
  .object({
    productId: z.string().uuid(),
    type: z.enum(['add', 'remove', 'adjustment']),
    quantity: z.number().int().min(0).max(100000),
    note: z.string().trim().max(500).optional(),
  })
  .refine(body => body.type === 'adjustment' || body.quantity > 0, {
    message: 'Adding or removing needs a quantity of at least 1.',
  })

const rangeSchema = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
  type: z.enum(['add', 'remove', 'sale', 'adjustment']).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    // Without ?from&to the admin pages get the latest few entries; with them,
    // every entry in that window (optionally one type), for the reports.
    const params = Object.fromEntries(req.nextUrl.searchParams)
    const range = 'from' in params || 'to' in params ? rangeSchema.safeParse(params) : null
    if (range && !range.success) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 })
    }

    const baseQuery = () => {
      let query = admin.supabase
        .from('inventory_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id')
      if (range?.success) {
        query = query.gte('created_at', range.data.from).lte('created_at', range.data.to)
        if (range.data.type) query = query.eq('type', range.data.type)
      }
      return query
    }

    const rows: InventoryLogRow[] = []
    if (range?.success) {
      for (let page = 0; page < RANGE_MAX_PAGES; page++) {
        const from = page * RANGE_PAGE_SIZE
        const { data, error } = await baseQuery().range(from, from + RANGE_PAGE_SIZE - 1)
        if (error) throw error
        rows.push(...((data ?? []) as InventoryLogRow[]))
        if (!data || data.length < RANGE_PAGE_SIZE) break
      }
    } else {
      const { data, error } = await baseQuery().limit(LOG_LIMIT)
      if (error) throw error
      rows.push(...((data ?? []) as InventoryLogRow[]))
    }

    const logs = rows.map(log => ({
      id: log.id,
      productId: log.product_id,
      productName: log.product_name,
      type: log.type,
      quantity: log.quantity,
      previousStock: log.previous_stock,
      newStock: log.new_stock,
      note: log.note ?? undefined,
      createdAt: log.created_at,
    }))

    return NextResponse.json({ logs })
  } catch (error) {
    return serverError('admin/inventory', error, "Couldn't load the inventory log.")
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if ('response' in admin) return admin.response

    const parsed = stockSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a whole number: at least 1 to add or remove, or 0 or more to set the count.' },
        { status: 400 }
      )
    }
    const { productId, type, quantity, note } = parsed.data

    // Locked read-change-log in one transaction
    // (supabase/migrations/0017_adjust_stock_function.sql).
    const { data, error } = await createAdminClient().rpc('adjust_stock', {
      p_product_id: productId,
      p_type: type,
      p_quantity: quantity,
      p_note: note ?? null,
    })

    if (error?.message === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json({ error: 'That product no longer exists.' }, { status: 404 })
    }
    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error) {
    return serverError('admin/inventory', error, "Couldn't update the stock. Please try again.")
  }
}
