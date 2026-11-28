'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Product, CartItem } from '@/lib/types'
import { useStore } from './store-context'
import { useAuth } from './auth-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CartContextType {
  items: CartItem[]
  /** False when nothing was added because the visitor must sign in first. */
  addToCart: (product: Product, quantity?: number) => boolean
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
  const { user, isLoading: isAuthLoading } = useAuth()
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
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

  // Ordering needs an account, so ask for one at the first add rather than
  // letting a guest fill a cart they can't check out.
  const addToCart = (product: Product, quantity: number = 1): boolean => {
    if (!user) {
      if (isAuthLoading) {
        toast.info('Just a moment, checking your account...')
      } else {
        setShowAccountPrompt(true)
      }
      return false
    }
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
    return true
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
      <Dialog open={showAccountPrompt} onOpenChange={setShowAccountPrompt}>
        <DialogContent className="bg-background max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center font-serif text-xl">Create an account to order</DialogTitle>
            <DialogDescription className="text-center">
              You need an account to add breads to your cart and check out. It only takes a minute, and we&apos;ll
              save your details for next time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button asChild onClick={() => setShowAccountPrompt(false)}>
              <Link href="/login?mode=register&next=/%23products">Create an account</Link>
            </Button>
            <Button asChild variant="outline" onClick={() => setShowAccountPrompt(false)}>
              <Link href="/login?next=/%23products">I already have an account</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
