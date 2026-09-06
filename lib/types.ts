export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: 'bread' | 'pastry' | 'cake' | 'cookie' | 'other'
  image: string
  featured: boolean
  stock: number
  ingredients?: string[]
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  role: 'user' | 'admin'
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  deliveryType: 'delivery' | 'pickup'
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  paymentMethod: 'cash' | 'card'
  distance?: number
}

export interface InventoryLog {
  id: string
  productId: string
  productName: string
  type: 'add' | 'remove' | 'sale' | 'adjustment'
  quantity: number
  previousStock: number
  newStock: number
  note?: string
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  type: 'announcement' | 'advertisement'
  image?: string
  createdAt: string
  createdBy: string
}

export interface OrderFeedback {
  id: string
  orderId: string
  userId: string
  rating: number
  comment: string
  createdAt: string
}
