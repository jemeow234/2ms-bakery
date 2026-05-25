'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Order, InventoryLog, Announcement, OrderFeedback } from '@/lib/types'
import { initialProducts } from '@/lib/data'

interface StoreContextType {
  products: Product[]
  orders: Order[]
  inventoryLogs: InventoryLog[]
  announcements: Announcement[]
  feedbacks: OrderFeedback[]
  updateProduct: (product: Product) => void
  addProduct: (product: Omit<Product, 'id'>) => void
  deleteProduct: (id: string) => void
  updateStock: (productId: string, quantity: number, type: InventoryLog['type'], note?: string) => void
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void
  deleteAnnouncement: (id: string) => void
  addFeedback: (feedback: Omit<OrderFeedback, 'id' | 'createdAt'>) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [feedbacks, setFeedbacks] = useState<OrderFeedback[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedProducts = localStorage.getItem('bakery-products')
    const savedOrders = localStorage.getItem('bakery-orders')
    const savedLogs = localStorage.getItem('bakery-inventory-logs')
    const savedAnnouncements = localStorage.getItem('bakery-announcements')
    const savedFeedbacks = localStorage.getItem('bakery-feedbacks')
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    } else {
      setProducts(initialProducts)
    }
    
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders))
    }
    
    if (savedLogs) {
      setInventoryLogs(JSON.parse(savedLogs))
    }

    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements))
    }

    if (savedFeedbacks) {
      setFeedbacks(JSON.parse(savedFeedbacks))
    }
    
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bakery-products', JSON.stringify(products))
    }
  }, [products, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bakery-orders', JSON.stringify(orders))
    }
  }, [orders, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bakery-inventory-logs', JSON.stringify(inventoryLogs))
    }
  }, [inventoryLogs, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bakery-announcements', JSON.stringify(announcements))
    }
  }, [announcements, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bakery-feedbacks', JSON.stringify(feedbacks))
    }
  }, [feedbacks, isLoaded])

  const updateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    }
    setProducts(prev => [...prev, newProduct])
  }

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const updateStock = (
    productId: string, 
    quantity: number, 
    type: InventoryLog['type'], 
    note?: string
  ) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const previousStock = product.stock
    let newStock = previousStock

    switch (type) {
      case 'add':
        newStock = previousStock + quantity
        break
      case 'remove':
      case 'sale':
        newStock = Math.max(0, previousStock - quantity)
        break
      case 'adjustment':
        newStock = quantity
        break
    }

    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
    )

    const log: InventoryLog = {
      id: Date.now().toString(),
      productId,
      productName: product.name,
      type,
      quantity,
      previousStock,
      newStock,
      note,
      createdAt: new Date().toISOString()
    }

    setInventoryLogs(prev => [log, ...prev])
  }

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt'>): Order => {
    const order: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    // Update stock for each item
    order.items.forEach(item => {
      updateStock(item.product.id, item.quantity, 'sale', `Order ${order.id}`)
    })

    setOrders(prev => [order, ...prev])
    return order
  }

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => 
      prev.map(o => o.id === orderId ? { ...o, status } : o)
    )
  }

  const addAnnouncement = (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => {
    const announcement: Announcement = {
      ...announcementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setAnnouncements(prev => [announcement, ...prev])
  }

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const addFeedback = (feedbackData: Omit<OrderFeedback, 'id' | 'createdAt'>) => {
    const feedback: OrderFeedback = {
      ...feedbackData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setFeedbacks(prev => [feedback, ...prev])
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        inventoryLogs,
        announcements,
        feedbacks,
        updateProduct,
        addProduct,
        deleteProduct,
        updateStock,
        addOrder,
        updateOrderStatus,
        addAnnouncement,
        deleteAnnouncement,
        addFeedback
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
