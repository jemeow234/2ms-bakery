import { createClient } from '@/lib/supabase/server'
import { initialProducts } from '@/lib/data'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('[v0] Starting server-side migration...')

    // 1. Migrate Products (only if not already present)
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (!existingProducts || existingProducts.length === 0) {
      console.log('[v0] Migrating products...')
      const { error: productsError } = await supabase
        .from('products')
        .insert(initialProducts.map(p => ({
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image: p.image,
          featured: p.featured,
          stock: p.stock,
          ingredients: p.ingredients?.join(', ')
        })))
      
      if (productsError) {
        console.error('[v0] Products migration error:', productsError)
        return NextResponse.json(
          { error: 'Failed to migrate products', details: productsError },
          { status: 400 }
        )
      }
      console.log('[v0] Products migrated successfully')
    }

    console.log('[v0] Migration completed successfully!')
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}
