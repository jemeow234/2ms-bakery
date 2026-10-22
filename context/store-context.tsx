'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
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
  updateProduct: (product: Product) => Promise<boolean>
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>
  deleteProduct: (id: string) => Promise<void>
  updateStock: (productId: string, quantity: number, type: InventoryLog['type'], note?: string) => Promise<boolean>
  addOrder: (
    order: Omit<Order, 'id' | 'createdAt'>,
    paymentProof?: File
  ) => Promise<{ order: Order | null; error?: string }>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>) => Promise<boolean>
  deleteAnnouncement: (id: string) => Promise<boolean>
  addFeedback: (
    feedback: Pick<OrderFeedback, 'orderId' | 'rating' | 'comment'>
  ) => Promise<{ ok: boolean; error?: string }>
  refreshProducts: () => Promise<Product[] | null>
  refreshOrders: () => Promise<void>
  refreshAdminOrders: () => Promise<void>
  refreshInventoryLogs: () => Promise<void>
  refreshAnnouncements: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

// One store for the whole app (mounted in the root layout, admin included).
// Every function is stable and the context value only changes when the data
// does, so components that only call actions don't re-render on every fetch.
export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const isAdmin = user?.role === 'admin'

  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [adminOrders, setAdminOrders] = useState<Order[]>([])
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [feedbacks, setFeedbacks] = useState<OrderFeedback[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch products. Also returns them, for callers that need the fresh list
  // before the next render (checkout's stock and price check).
  const refreshProducts = useCallback(async (): Promise<Product[] | null> => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/products', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const fresh: Product[] = data.products || []
        setProducts(fresh)
        return fresh
      }
      return null
    } catch (error) {
      console.error('[store] Failed to fetch products:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // The signed-in customer's own orders
  const refreshOrders = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('[store] Failed to fetch orders:', error)
    }
  }, [userId])

  // Every order (admin only)
  const refreshAdminOrders = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()
        setAdminOrders(data.orders || [])
      }
    } catch (error) {
      console.error('[store] Failed to fetch admin orders:', error)
    }
  }, [isAdmin])

  // Latest inventory activity (admin only)
  const refreshInventoryLogs = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/admin/inventory')
      if (res.ok) {
        const data = await res.json()
        setInventoryLogs(data.logs || [])
      }
    } catch (error) {
      console.error('[store] Failed to fetch inventory logs:', error)
    }
  }, [isAdmin])

  const refreshAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('[store] Failed to fetch announcements:', error)
    }
  }, [])

  // Initial load — fetches data from the API, standard effect-based data fetching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProducts()
    refreshAnnouncements()
  }, [refreshProducts, refreshAnnouncements])

  // Reload account data when the person signs in or out
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrders([])
      setAdminOrders([])
      setInventoryLogs([])
      return
    }
    refreshOrders()
    if (isAdmin) {
      refreshAdminOrders()
      refreshInventoryLogs()
    }
  }, [userId, isAdmin, refreshOrders, refreshAdminOrders, refreshInventoryLogs])

  const updateProduct = useCallback(async (product: Product): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      })
      if (res.ok) {
        // The saved row, not the dialog's copy — its stock may be out of date.
        const data = await res.json()
        setProducts(prev => prev.map(p => p.id === product.id ? data.product : p))
        return true
      }
      return false
    } catch (error) {
      console.error('[store] Failed to update product:', error)
      return false
    }
  }, [])

  const addProduct = useCallback(async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(prev => [data.product, ...prev])
        return true
      }
      return false
    } catch (error) {
      console.error('[store] Failed to add product:', error)
      return false
    }
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('[store] Failed to delete product:', error)
    }
  }, [])

  const updateStock = useCallback(async (
    productId: string,
    quantity: number,
    type: InventoryLog['type'],
    note?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, type, note })
      })
      if (res.ok) {
        await refreshProducts()
        await refreshInventoryLogs()
        return true
      }
      return false
    } catch (error) {
      console.error('[store] Failed to update stock:', error)
      return false
    }
  }, [refreshProducts, refreshInventoryLogs])

  const addOrder = useCallback(async (
    orderData: Omit<Order, 'id' | 'createdAt'>,
    paymentProof?: File
  ): Promise<{ order: Order | null; error?: string }> => {
    // The server prices the order itself; it only needs ids and quantities,
    // plus the total the customer was shown so it can catch a price change.
    const payload = {
      items: orderData.items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      expectedTotal: orderData.total,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      address: orderData.address,
      deliveryType: orderData.deliveryType,
      paymentMethod: orderData.paymentMethod,
      deliveryDate: orderData.deliveryDate,
      deliverySession: orderData.deliverySession,
      // POS sales are the only orders created already completed.
      walkIn: orderData.status === 'completed',
    }
    try {
      let res: Response
      if (paymentProof) {
        // Multipart so the screenshot travels with the order in one request;
        // the browser sets the boundary header itself.
        const form = new FormData()
        form.append('order', JSON.stringify(payload))
        form.append('paymentProof', paymentProof)
        res = await fetch('/api/orders', { method: 'POST', body: form })
      } else {
        res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      if (res.ok) {
        const data = await res.json()
        // A walk-in isn't one of the signed-in admin's own orders.
        if (!payload.walkIn) {
          setOrders(prev => [data.order, ...prev])
        }
        if (isAdmin) {
          setAdminOrders(prev => [data.order, ...prev])
        }
        // Stock just went down.
        refreshProducts()
        return { order: data.order }
      }
      // A 409 means prices or stock moved under the cart; reload the catalog
      // so the cart shows what the server will actually accept.
      if (res.status === 409) {
        refreshProducts()
      }
      // Pass the API's reason through (out of range, session closed, …) so the
      // caller can show it instead of a generic failure.
      const data = await res.json().catch(() => ({}))
      return { order: null, error: data.error }
    } catch (error) {
      console.error('[store] Failed to create order:', error)
      return { order: null }
    }
  }, [isAdmin, refreshProducts])

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']): Promise<boolean> => {
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
        // A cancellation put stock back.
        if (status === 'cancelled') {
          refreshProducts()
          refreshInventoryLogs()
        }
        return true
      }
      return false
    } catch (error) {
      console.error('[store] Failed to update order status:', error)
      return false
    }
  }, [refreshProducts, refreshInventoryLogs])

  const addAnnouncement = useCallback(async (
    announcementData: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      })
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(prev => [data.announcement, ...prev])
        return true
      }
      return false
    } catch (error) {
      console.error('[store] Failed to create announcement:', error)
      return false
    }
  }, [])

  const deleteAnnouncement = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
        return true
      }
      return false
    } catch (error) {
      console.error('[store] Failed to delete announcement:', error)
      return false
    }
  }, [])

  const addFeedback = useCallback(async (
    feedbackData: Pick<OrderFeedback, 'orderId' | 'rating' | 'comment'>
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setFeedbacks(prev => [data.feedback, ...prev])
        return { ok: true }
      }
      return { ok: false, error: data.error }
    } catch (error) {
      console.error('[store] Failed to add feedback:', error)
      return { ok: false }
    }
  }, [])

  const value = useMemo<StoreContextType>(() => ({
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
    refreshAnnouncements,
  }), [
    products, orders, adminOrders, inventoryLogs, announcements, feedbacks, isLoading,
    updateProduct, addProduct, deleteProduct, updateStock, addOrder, updateOrderStatus,
    addAnnouncement, deleteAnnouncement, addFeedback, refreshProducts, refreshOrders,
    refreshAdminOrders, refreshInventoryLogs, refreshAnnouncements,
  ])

  return (
    <StoreContext.Provider value={value}>
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
