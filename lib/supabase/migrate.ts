import { createClient } from './server'
import { initialProducts } from '@/lib/data'

export async function migrateLocalStorageToSupabase() {
  const supabase = createClient()
  
  try {
    console.log('[v0] Starting migration from localStorage to Supabase...')

    // Get current user to verify we're authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[v0] No authenticated user, skipping migration')
      return { success: false, message: 'No authenticated user' }
    }

    // 1. Migrate Products
    console.log('[v0] Migrating products...')
    const existingProducts = await supabase.from('products').select('id').limit(1)
    
    if (existingProducts.data && existingProducts.data.length === 0) {
      const { error: productsError } = await supabase
        .from('products')
        .insert(initialProducts.map(p => ({
          id: undefined, // Let database generate UUID
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
        return { success: false, message: 'Failed to migrate products' }
      }
      console.log('[v0] Products migrated successfully')
    }

    // 2. Migrate registered users from localStorage
    console.log('[v0] Migrating registered users...')
    const savedUsers = localStorage.getItem('bakery-registered-users')
    if (savedUsers) {
      const users = JSON.parse(savedUsers)
      for (const user of users) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone || null,
            address: user.address || null,
            password: user.password,
            role: user.role
          })
          .select()
        
        if (userError && !userError.message.includes('duplicate')) {
          console.error('[v0] User migration error:', userError)
        }
      }
      console.log('[v0] Users migrated')
    }

    // 3. Migrate orders
    console.log('[v0] Migrating orders...')
    const savedOrders = localStorage.getItem('bakery-orders')
    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      for (const order of orders) {
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: order.id,
            user_id: order.user_id || null,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            customer_phone: order.customerPhone,
            address: order.address,
            delivery_type: order.deliveryType,
            distance: order.distance || null,
            total: order.total,
            status: order.status,
            payment_method: order.paymentMethod,
            created_at: order.createdAt
          })
          .select()
        
        if (orderError) {
          console.error('[v0] Order migration error:', orderError)
        } else {
          // Migrate order items
          for (const item of order.items) {
            await supabase.from('order_items').insert({
              order_id: order.id,
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              created_at: new Date().toISOString()
            })
          }
        }
      }
      console.log('[v0] Orders migrated')
    }

    // 4. Migrate announcements
    console.log('[v0] Migrating announcements...')
    const savedAnnouncements = localStorage.getItem('bakery-announcements')
    if (savedAnnouncements) {
      const announcements = JSON.parse(savedAnnouncements)
      for (const announcement of announcements) {
        await supabase.from('announcements').insert({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          type: announcement.type,
          image: announcement.image || null,
          created_by: announcement.createdBy || user.id,
          created_at: announcement.createdAt
        })
      }
      console.log('[v0] Announcements migrated')
    }

    // 5. Migrate feedback
    console.log('[v0] Migrating feedback...')
    const savedFeedbacks = localStorage.getItem('bakery-feedbacks')
    if (savedFeedbacks) {
      const feedbacks = JSON.parse(savedFeedbacks)
      for (const feedback of feedbacks) {
        await supabase.from('order_feedback').insert({
          id: feedback.id,
          order_id: feedback.orderId,
          user_id: feedback.userId,
          rating: feedback.rating,
          comment: feedback.comment,
          created_at: feedback.createdAt
        })
      }
      console.log('[v0] Feedback migrated')
    }

    console.log('[v0] Migration completed successfully!')
    return { success: true, message: 'Migration completed' }
  } catch (error) {
    console.error('[v0] Migration error:', error)
    return { success: false, message: 'Migration failed', error }
  }
}
