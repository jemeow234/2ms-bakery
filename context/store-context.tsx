'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Order, InventoryLog } from '@/lib/types'
import { initialProducts } from '@/lib/data'

interface StoreContextType {
  products: Product[]
  orders: Order[]
  inventoryLogs: InventoryLog[]
  updateProduct: (product: Product) => void
  addProduct: (product: Omit<Product, 'id'>) => void
  deleteProduct: (id: string) => void
  updateStock: (productId: string, quantity: number, type: InventoryLog['type'], note?: string) => void
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order
  updateOrderStatus: (orderId: string, status: Order['status']) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedProducts = localStorage.getItem('bakery-products')
    const savedOrders = localStorage.getItem('bakery-orders')
    const savedLogs = localStorage.getItem('bakery-inventory-logs')
    
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

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        inventoryLogs,
        updateProduct,
        addProduct,
        deleteProduct,
        updateStock,
        addOrder,
        updateOrderStatus
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
