'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Order, InventoryLog, Announcement, OrderFeedback } from '@/lib/types'
import { useAuth } from './auth-context'

interface StoreContextType {
  products: Product[]
  orders: Order[]
  adminOrders: Order[]
  inventoryLogs: InventoryLog[]
  announcements: Announcement[]
  feedbacks: OrderFeedback[]
  isLoading: boolean
  updateProduct: (product: Product) => Promise<void>
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  updateStock: (productId: string, quantity: number, type: InventoryLog['type'], note?: string) => Promise<void>
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<Order | null>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  addFeedback: (feedback: Omit<OrderFeedback, 'id' | 'createdAt'>) => Promise<void>
  refreshProducts: () => Promise<void>
  refreshOrders: () => Promise<void>
  refreshAdminOrders: () => Promise<void>
  refreshInventoryLogs: () => Promise<void>
  refreshAnnouncements: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [adminOrders, setAdminOrders] = useState<Order[]>([])
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [feedbacks, setFeedbacks] = useState<OrderFeedback[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch products
  const refreshProducts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch user's orders
  const refreshOrders = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch orders:', error)
    }
  }

  // Fetch all orders (admin only)
  const refreshAdminOrders = async () => {
    if (!user || user.role !== 'admin') return
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()
        setAdminOrders(data.orders || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch admin orders:', error)
    }
  }

  // Fetch inventory activity log (admin only)
  const refreshInventoryLogs = async () => {
    if (!user || user.role !== 'admin') return
    try {
      const res = await fetch('/api/admin/inventory')
      if (res.ok) {
        const data = await res.json()
        setInventoryLogs(data.logs || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch inventory logs:', error)
    }
  }

  // Fetch announcements
  const refreshAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch announcements:', error)
    }
  }

  // Initial load — fetches data from the API, standard effect-based data fetching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProducts()
    refreshAnnouncements()
  }, [])

  // Refresh orders when user changes
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshOrders()
      if (user.role === 'admin') {
        refreshAdminOrders()
        refreshInventoryLogs()
      }
    }
  }, [user])

  const updateProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      })
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p))
      }
    } catch (error) {
      console.error('[v0] Failed to update product:', error)
    }
  }

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(prev => [data.product, ...prev])
      }
    } catch (error) {
      console.error('[v0] Failed to add product:', error)
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('[v0] Failed to delete product:', error)
    }
  }

  const updateStock = async (
    productId: string,
    quantity: number,
    type: InventoryLog['type'],
    note?: string
  ) => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, type, note })
      })
      if (res.ok) {
        await refreshProducts()
      }
    } catch (error) {
      console.error('[v0] Failed to update stock:', error)
    }
  }

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(prev => [data.order, ...prev])
        if (user?.role === 'admin') {
          setAdminOrders(prev => [data.order, ...prev])
        }
        return data.order
      }
      return null
    } catch (error) {
      console.error('[v0] Failed to create order:', error)
      return null
    }
  }

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        setAdminOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status } : o)
        )
      }
    } catch (error) {
      console.error('[v0] Failed to update order status:', error)
    }
  }

  const addAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      })
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(prev => [data.announcement, ...prev])
      }
    } catch (error) {
      console.error('[v0] Failed to create announcement:', error)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('[v0] Failed to delete announcement:', error)
    }
  }

  const addFeedback = async (feedbackData: Omit<OrderFeedback, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      })
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(prev => [data.feedback, ...prev])
      }
    } catch (error) {
      console.error('[v0] Failed to add feedback:', error)
    }
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        adminOrders,
        inventoryLogs,
        announcements,
        feedbacks,
        isLoading,
        updateProduct,
        addProduct,
        deleteProduct,
        updateStock,
        addOrder,
        updateOrderStatus,
        addAnnouncement,
        deleteAnnouncement,
        addFeedback,
        refreshProducts,
        refreshOrders,
        refreshAdminOrders,
        refreshInventoryLogs,
        refreshAnnouncements
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
