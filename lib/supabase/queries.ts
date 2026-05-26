import { createClient } from '@/lib/supabase/client'
import { User, Product, Order, Announcement, OrderFeedback } from '@/lib/types'

const supabase = createClient()

// Products
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Product[]
}

export async function fetchProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Product
}

// Orders
export async function fetchUserOrders() {
  const { data, error } = await supabase
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
  
  if (error) throw error
  return data as Order[]
}

export async function fetchOrderById(id: string) {
  const { data, error } = await supabase
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
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Order
}

// Announcements
export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Announcement[]
}

// Feedback
export async function createFeedback(feedback: Omit<OrderFeedback, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('order_feedback')
    .insert(feedback)
    .select()
    .single()
  
  if (error) throw error
  return data as OrderFeedback
}

// User Profile
export async function fetchUserProfile() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  
  if (!data.user) return null
  
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()
  
  if (profileError) throw profileError
  return profile as User
}

export async function updateUserProfile(updates: Partial<User>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data as User
}
