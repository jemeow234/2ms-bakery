'use client'

import { useRef, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeedbackModal } from '@/components/feedback-modal'
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Wallet,
  Banknote,
  Loader2,
  CheckCircle2,
  LogIn,
  MapPin,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  BAKERY_ORIGIN,
  DELIVERY_RANGE_KM,
  DELIVERY_SESSIONS,
  DELIVERY_SESSION_KEYS,
  DeliverySession,
  MINIMUM_ORDER_QUANTITY,
  bakeryTodayISO,
  formatSchedule,
  formatSession,
  formatTime,
  getSelectableSessions,
} from '@/lib/delivery'
import { LogoMark } from '@/components/logo-mark'

type QuoteStatus = 'idle' | 'loading' | 'ok' | 'out_of_range' | 'not_found' | 'error'

interface DeliveryQuoteState {
  distanceKm: number
  withinRange: boolean
  matchedAddress: string
}

export default function CheckoutPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()
  const { addOrder } = useStore()
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup',
    paymentMethod: 'gcash' as 'gcash' | 'cash',
  })

  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuoteState | null>(null)
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliverySession, setDeliverySession] = useState<DeliverySession | ''>('')
  // Bumped on every lookup and every address edit, so a slow response for an
  // older address can never overwrite the result for the current one.
  const quoteRequestId = useRef(0)

  // Pre-fill form with user data once, when the user logs in
  const [prefilledForUserId, setPrefilledForUserId] = useState<string | null>(null)
  if (user && prefilledForUserId !== user.id) {
    setPrefilledForUserId(user.id)
    setFormData(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    }))
  }

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  /**
   * Geocodes the address server-side and returns the quote. Callers must use
   * the returned value rather than reading `deliveryQuote` back from state,
   * which is a render behind.
   */
  const fetchDeliveryQuote = async (address: string): Promise<DeliveryQuoteState | null> => {
    if (!address.trim()) {
      setDeliveryQuote(null)
      setQuoteStatus('idle')
      return null
    }

    const requestId = ++quoteRequestId.current
    setQuoteStatus('loading')
    try {
      const res = await fetch('/api/delivery/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (requestId !== quoteRequestId.current) return null

      if (!res.ok || !data.found) {
        setDeliveryQuote(null)
        setQuoteStatus(res.ok ? 'not_found' : 'error')
        return null
      }

      const quote: DeliveryQuoteState = {
        distanceKm: data.distanceKm,
        withinRange: data.withinRange,
        matchedAddress: data.matchedAddress,
      }
      setDeliveryQuote(quote)
      setQuoteStatus(quote.withinRange ? 'ok' : 'out_of_range')
      return quote
    } catch {
      if (requestId !== quoteRequestId.current) return null
      setDeliveryQuote(null)
      setQuoteStatus('error')
      return null
    }
  }

  const resetDeliveryQuote = () => {
    quoteRequestId.current++
    setDeliveryQuote(null)
    setQuoteStatus('idle')
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const isDelivery = formData.deliveryType === 'delivery'
  const selectableSessions = deliveryDate ? getSelectableSessions(deliveryDate) : []
  const hasSchedule = Boolean(deliveryDate && deliverySession)
  // Only a known-bad address blocks the button. handleSubmit re-checks anything
  // unverified itself, so a pre-filled address, a failed lookup, or a click that
  // lands while the blur-triggered check is running all still go through.
  const addressBlocksCheckout =
    isDelivery && (quoteStatus === 'out_of_range' || quoteStatus === 'not_found')
  const canCheckout =
    totalQuantity >= MINIMUM_ORDER_QUANTITY && hasSchedule && !addressBlocksCheckout

  // An address pre-filled from the profile never gets a blur event, so check it
  // as soon as the customer reaches the details step.
  const goToDetails = () => {
    setStep('details')
    if (isDelivery && quoteStatus === 'idle' && formData.address.trim()) {
      fetchDeliveryQuote(formData.address)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isProcessing) return

    // Validate minimum quantity
    if (totalQuantity < MINIMUM_ORDER_QUANTITY) {
      toast.error(`Minimum order quantity is ${MINIMUM_ORDER_QUANTITY} items`)
      return
    }

    if (!hasSchedule) {
      toast.error('Please choose a delivery date and time')
      return
    }

    // Lock the button before the address check, not after — otherwise a
    // double-click during the lookup places the order twice.
    setIsProcessing(true)

    // Use the returned quote directly — reading it back from state here would
    // pick up the previous render's value.
    let quote = deliveryQuote
    if (isDelivery) {
      if (quoteStatus !== 'ok' || !quote) {
        quote = await fetchDeliveryQuote(formData.address)
      }
      if (!quote) {
        toast.error("We couldn't verify that address. Please check it and try again.")
        setIsProcessing(false)
        return
      }
      if (!quote.withinRange) {
        toast.error(
          `That address is ${quote.distanceKm.toFixed(1)}km away. Maximum delivery range is ${DELIVERY_RANGE_KM}km.`
        )
        setIsProcessing(false)
        return
      }
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      const { order, error } = await addOrder({
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        total: totalPrice,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        address: formData.address,
        deliveryType: formData.deliveryType,
        distance: isDelivery && quote ? quote.distanceKm : undefined,
        deliveryDate,
        deliverySession: deliverySession as DeliverySession,
        status: 'pending',
        paymentMethod: formData.paymentMethod,
      })

      if (!order) {
        toast.error(error || 'Failed to place order. Please try again.')
        setIsProcessing(false)
        return
      }

      setOrderNumber(order.id)
      setLastOrder(order)
      clearCart()
      setStep('success')
      setShowFeedback(true)
      toast.success('Order placed successfully!')
    } catch (error) {
      toast.error('Failed to place order. Please try again.')
    }

    setIsProcessing(false)
  }

  if (step === 'success') {
    return (
      <>
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
            <p className="text-muted-foreground text-sm mb-2">
              {formData.deliveryType === 'delivery'
                ? `Delivery to ${formData.address}`
                : 'Pick-up at 2M\'s Bakery'
              }
            </p>
            {formatSchedule(deliveryDate, deliverySession || null) && (
              <p className="text-sm font-medium text-primary mb-2">
                {formatSchedule(deliveryDate, deliverySession || null)}
              </p>
            )}
            <p className="text-muted-foreground text-sm mb-8">
              We&apos;ll prepare your items with love. We&apos;ll email your receipt to{' '}
              {formData.email} once your order is completed.
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
        <FeedbackModal 
          order={lastOrder} 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)}
          userId={user?.id || 'guest'}
        />
      </>
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
            <LogoMark className="w-9 h-9" priority />
            <span className="font-serif text-lg font-bold text-foreground">2M&apos;s Bakery</span>
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
              <div className="flex items-center gap-4 mb-8 overflow-x-auto">
                <button
                  onClick={() => setStep('cart')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                    step === 'cart'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Cart
                </button>
                <div className="h-px flex-1 bg-border min-w-4" />
                <button
                  onClick={() => items.length > 0 && goToDetails()}
                  disabled={items.length === 0}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
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
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        {imageErrors[item.product.id] ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">
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
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {item.product.category}
                            </p>
                          </div>
                          <p className="font-serif text-lg font-bold text-primary whitespace-nowrap">
                            ₱{(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4 gap-2">
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-2 hover:bg-secondary transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-2 sm:px-4 py-2 font-medium min-w-[2rem] text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-2 hover:bg-secondary transition-colors"
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

                  {totalQuantity < MINIMUM_ORDER_QUANTITY && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-900">Minimum Order Required</p>
                        <p className="text-sm text-amber-800">
                          Add {MINIMUM_ORDER_QUANTITY - totalQuantity} more item(s) to checkout
                        </p>
                      </div>
                    </div>
                  )}
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

                  {/* Delivery Type */}
                  <div>
                    <Label className="mb-3 block">Delivery Type</Label>
                    <RadioGroup
                      value={formData.deliveryType}
                      onValueChange={(value: 'delivery' | 'pickup') => {
                        setFormData(s => ({ ...s, deliveryType: value }))
                        // Switching back to delivery keeps the typed address, so
                        // re-check it rather than leaving it unverified.
                        if (value === 'delivery' && formData.address.trim()) {
                          fetchDeliveryQuote(formData.address)
                        } else {
                          resetDeliveryQuote()
                        }
                      }}
                      className="grid sm:grid-cols-2 gap-4"
                    >
                      <label
                        htmlFor="delivery"
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          formData.deliveryType === 'delivery'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <RadioGroupItem value="delivery" id="delivery" />
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Delivery</p>
                          <p className="text-sm text-muted-foreground">Free delivery up to {DELIVERY_RANGE_KM}km</p>
                        </div>
                      </label>
                      <label
                        htmlFor="pickup"
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          formData.deliveryType === 'pickup'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <RadioGroupItem value="pickup" id="pickup" />
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Pick-up</p>
                          <p className="text-sm text-muted-foreground">Collect from store</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {/* Delivery / pick-up schedule */}
                  <div>
                    <Label className="mb-3 block">
                      {isDelivery ? 'Delivery Time' : 'Pick-up Time'}
                    </Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      min={bakeryTodayISO()}
                      onChange={e => {
                        setDeliveryDate(e.target.value)
                        setDeliverySession('')
                      }}
                      required
                      className="bg-secondary"
                    />
                    <Select
                      value={deliverySession}
                      onValueChange={(value: DeliverySession) => setDeliverySession(value)}
                      disabled={!deliveryDate || selectableSessions.length === 0}
                    >
                      <SelectTrigger className="w-full mt-4 bg-secondary">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <SelectValue placeholder="Select a time" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_SESSION_KEYS.map(key => (
                          <SelectItem
                            key={key}
                            value={key}
                            disabled={!selectableSessions.includes(key)}
                          >
                            {formatSession(key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!deliveryDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Choose a date to see available times.
                      </p>
                    )}
                    {deliveryDate && selectableSessions.length === 0 && (
                      <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        No times left on that date. Please pick a later date.
                      </p>
                    )}
                  </div>

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
                      placeholder="0917 123 4567"
                      required
                      className="mt-2 bg-secondary"
                    />
                  </div>

                  {formData.deliveryType === 'delivery' && (
                    <div>
                      <Label htmlFor="address">Delivery Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={e => {
                          setFormData(s => ({ ...s, address: e.target.value }))
                          // Invalidate the previous quote so an edited address
                          // can never be submitted with a stale distance.
                          resetDeliveryQuote()
                        }}
                        onBlur={() => {
                          if (quoteStatus === 'idle') fetchDeliveryQuote(formData.address)
                        }}
                        placeholder="House no., Street, Barangay, City"
                        required
                        className="mt-2 bg-secondary"
                      />
                      {quoteStatus === 'loading' && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking distance…
                        </p>
                      )}
                      {quoteStatus === 'ok' && deliveryQuote && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {deliveryQuote.distanceKm.toFixed(1)}km away · {deliveryQuote.matchedAddress}
                        </p>
                      )}
                      {quoteStatus === 'out_of_range' && deliveryQuote && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Address is {deliveryQuote.distanceKm.toFixed(1)}km away. Maximum delivery
                          range is {DELIVERY_RANGE_KM}km.
                        </p>
                      )}
                      {quoteStatus === 'not_found' && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          We couldn&apos;t find that address. Please add more detail.
                        </p>
                      )}
                      {quoteStatus === 'error' && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Address check is unavailable right now. Please try again.
                        </p>
                      )}
                    </div>
                  )}

                  {formData.deliveryType === 'pickup' && (
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm font-medium text-foreground">Pick-up Location</p>
                      <p className="text-sm text-muted-foreground mt-1">{BAKERY_ORIGIN.address}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Pick-up hours: {formatTime(DELIVERY_SESSIONS[DELIVERY_SESSION_KEYS[0]].start)} –{' '}
                        {formatTime(DELIVERY_SESSIONS[DELIVERY_SESSION_KEYS[DELIVERY_SESSION_KEYS.length - 1]].end)}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="mb-3 block">Payment Method</Label>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value: 'gcash' | 'cash') =>
                        setFormData(s => ({ ...s, paymentMethod: value }))
                      }
                      className="grid sm:grid-cols-2 gap-4"
                    >
                      <label
                        htmlFor="gcash"
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          formData.paymentMethod === 'gcash'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <RadioGroupItem value="gcash" id="gcash" />
                        <Wallet className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">GCash</p>
                          <p className="text-sm text-muted-foreground">{isDelivery ? 'Pay on delivery' : 'Pay on pick-up'}</p>
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
                          <p className="text-sm text-muted-foreground">{isDelivery ? 'Pay on delivery' : 'Pay on pick-up'}</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing || !canCheckout}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      `Place Order - ₱${totalPrice.toFixed(2)}`
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6 sticky top-24">
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
                        ₱{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({totalQuantity})</span>
                    <span className="text-foreground">₱{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600 font-medium">
                      {formData.deliveryType === 'pickup' ? 'N/A' : 'Free'}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-serif text-2xl font-bold text-primary">
                      ₱{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {step === 'cart' && items.length > 0 && (
                  <Button
                    onClick={() => {
                      if (totalQuantity < MINIMUM_ORDER_QUANTITY) {
                        toast.error(`Add ${MINIMUM_ORDER_QUANTITY - totalQuantity} more item(s) to checkout`)
                      } else {
                        goToDetails()
                      }
                    }}
                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={totalQuantity < MINIMUM_ORDER_QUANTITY}
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
