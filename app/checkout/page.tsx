'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cart-context'
import { useStore } from '@/context/store-context'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle2,
  LogIn,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function CheckoutPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()
  const { addOrder } = useStore()
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'card' as 'card' | 'cash',
  })

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      }))
    }
  }, [user])

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      const order = addOrder({
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        total: totalPrice,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        address: formData.address,
        status: 'pending',
        paymentMethod: formData.paymentMethod,
      })

      setOrderNumber(order.id)
      clearCart()
      setStep('success')
      toast.success('Order placed successfully!')
    } catch (error) {
      toast.error('Failed to place order. Please try again.')
    }

    setIsProcessing(false)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground mb-2">
            Thank you for your order. Your order number is:
          </p>
          <p className="font-mono text-lg font-bold text-primary mb-6">{orderNumber}</p>
          <p className="text-muted-foreground text-sm mb-8">
            We&apos;ll prepare your items with love. You&apos;ll receive a confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Continue Shopping</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif text-lg font-bold">G</span>
            </div>
            <span className="font-serif text-lg font-bold text-foreground">Golden Crust</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-sm text-muted-foreground">
                Hi, {user.name.split(' ')[0]}
              </span>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {items.length === 0 && step === 'cart' ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-8">
              Looks like you haven&apos;t added any items yet.
            </p>
            <Link href="/#products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => setStep('cart')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    step === 'cart'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Cart
                </button>
                <div className="h-px flex-1 bg-border" />
                <button
                  onClick={() => items.length > 0 && setStep('details')}
                  disabled={items.length === 0}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    step === 'details'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Checkout
                </button>
              </div>

              {step === 'cart' && (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    Shopping Cart ({items.length} items)
                  </h2>

                  {items.map(item => (
                    <div
                      key={item.product.id}
                      className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
                    >
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        {imageErrors[item.product.id] ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl">
                              {item.product.category === 'bread' ? '🍞' : item.product.category === 'pastry' ? '🥐' : '🍰'}
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(item.product.id)}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {item.product.category}
                            </p>
                          </div>
                          <p className="font-serif text-lg font-bold text-primary whitespace-nowrap">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-2 hover:bg-secondary transition-colors rounded-l-lg"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-2 hover:bg-secondary transition-colors rounded-r-lg"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 'details' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      Checkout Details
                    </h2>
                    {!user && (
                      <Link href="/login">
                        <Button variant="outline" size="sm" className="gap-2">
                          <LogIn className="h-4 w-4" />
                          Sign in to auto-fill
                        </Button>
                      </Link>
                    )}
                  </div>

                  {user && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-6">
                      <p className="text-sm text-muted-foreground">
                        Logged in as <span className="font-medium text-foreground">{user.name}</span>. 
                        Your saved details have been auto-filled.
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
                        placeholder="John Doe"
                        required
                        className="mt-2 bg-secondary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(s => ({ ...s, email: e.target.value }))}
                        placeholder="john@example.com"
                        required
                        className="mt-2 bg-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData(s => ({ ...s, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      required
                      className="mt-2 bg-secondary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e => setFormData(s => ({ ...s, address: e.target.value }))}
                      placeholder="123 Main St, City, State 12345"
                      required
                      className="mt-2 bg-secondary"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Payment Method</Label>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value: 'card' | 'cash') =>
                        setFormData(s => ({ ...s, paymentMethod: value }))
                      }
                      className="grid sm:grid-cols-2 gap-4"
                    >
                      <label
                        htmlFor="card"
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          formData.paymentMethod === 'card'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <RadioGroupItem value="card" id="card" />
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Card Payment</p>
                          <p className="text-sm text-muted-foreground">Pay on delivery</p>
                        </div>
                      </label>
                      <label
                        htmlFor="cash"
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          formData.paymentMethod === 'cash'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <RadioGroupItem value="cash" id="cash" />
                        <Banknote className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Cash</p>
                          <p className="text-sm text-muted-foreground">Pay on delivery</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      `Place Order - $${totalPrice.toFixed(2)}`
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h3 className="font-serif text-xl font-bold text-foreground mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} x {item.quantity}
                      </span>
                      <span className="text-foreground font-medium">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-serif text-2xl font-bold text-primary">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {step === 'cart' && items.length > 0 && (
                  <Button
                    onClick={() => setStep('details')}
                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Proceed to Checkout
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
