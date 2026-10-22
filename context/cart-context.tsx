'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, CartItem } from '@/lib/types'
import { useStore } from './store-context'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// A cart saved by an older version of the site, edited by hand or cut short
// must not take the whole page down — anything unreadable is dropped.
function readSavedCart(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem('bakery-cart') ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter(
      (item): item is CartItem =>
        typeof item?.product?.id === 'string' &&
        typeof item.product.price === 'number' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useStore()
  const [savedItems, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // The saved cart holds a snapshot of each product from when it was added.
  // Show the live catalog's price and stock instead, so the total the customer
  // sees is the one the server will charge.
  const liveProducts = new Map(products.map(p => [p.id, p]))
  const items = savedItems.map(item => {
    const live = liveProducts.get(item.product.id)
    return live ? { ...item, product: live } : item
  })

  useEffect(() => {
    // localStorage isn't available during SSR, so the cart must be loaded
    // in an effect rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readSavedCart())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bakery-cart', JSON.stringify(savedItems))
    }
  }, [savedItems, isLoaded])

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
