'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useStore } from '@/context/store-context'
import { Product, CartItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle2,
  User,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const categories = ['all', 'bread', 'pastry', 'cake', 'cookie', 'other'] as const

export default function POSPage() {
  const { products, addOrder } = useStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory
    return matchesSearch && matchesCategory && product.stock > 0
  })

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Not enough stock')
        return
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId))
    } else {
      const product = cart.find(item => item.product.id === productId)?.product
      if (product && quantity > product.stock) {
        toast.error('Not enough stock')
        return
      }
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('')
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setIsProcessing(true)

    const order = await addOrder({
      items: cart,
      total: totalPrice,
      customerName: customerName || 'Walk-in Customer',
      customerEmail: '',
      customerPhone: '',
      address: 'In-Store Purchase',
      deliveryType: 'pickup',
      status: 'completed',
      paymentMethod,
    })

    setIsProcessing(false)

    if (!order) {
      toast.error('Failed to complete sale. Please try again.')
      return
    }

    setShowSuccess(true)
    toast.success('Order completed!')
    setTimeout(() => {
      setShowSuccess(false)
      clearCart()
    }, 2000)
  }

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
            Payment Successful!
          </h2>
          <p className="text-muted-foreground">Order has been processed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">POS System</h1>
          <p className="text-muted-foreground">Quick sale terminal for in-store purchases</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'capitalize whitespace-nowrap',
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'border-border'
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-3 relative">
                  {imageErrors[product.id] ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      onError={() => handleImageError(product.id)}
                    />
                  )}
                  {product.stock <= 5 && (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                      {product.stock} left
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                <p className="text-primary font-bold">₱{product.price.toFixed(2)}</p>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <Card className="w-96 flex flex-col border-border flex-shrink-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground">Current Order</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Customer Name */}
          <div className="mb-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No items in cart
              </p>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₱{item.product.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-card rounded transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-card rounded transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                'flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all',
                paymentMethod === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <Banknote className="h-5 w-5" />
              <span className="font-medium">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={cn(
                'flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all',
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Card</span>
            </button>
          </div>

          {/* Total & Actions */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between mb-4">
              <span className="text-lg font-medium text-foreground">Total</span>
              <span className="font-serif text-2xl font-bold text-primary">
                ₱{totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="border-border"
              >
                Clear
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isProcessing ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
