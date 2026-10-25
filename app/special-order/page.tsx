'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, LogIn, MapPin, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LogoMark } from '@/components/logo-mark'
import { useAuth } from '@/context/auth-context'
import { useStore } from '@/context/store-context'
import { SHOP_EMAIL, SHOP_PHONE } from '@/lib/shop'
import {
  SPECIAL_ORDER_LEAD_DAYS,
  SPECIAL_ORDER_MAXIMUM,
  SPECIAL_ORDER_MINIMUM,
  SPECIAL_ORDER_PRESETS,
  earliestSpecialOrderDate,
} from '@/lib/special-order'
import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'

const OTHER_PRODUCT = 'Other (described in notes)'
const OTHER_QUANTITY = 'others'

const noSubscription = () => () => {}

export default function SpecialOrderPage() {
  const { user, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to the shop</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-9 h-9" priority />
            <span className="text-lg font-bold tracking-tight text-foreground">2M&apos;s Bakery</span>
          </Link>
          <span className="w-24" aria-hidden="true" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Special Orders</h1>
        <p className="text-muted-foreground mb-8">
          Planning a party, event or office treat? Order in bulk — minimum of {SPECIAL_ORDER_MINIMUM} pieces,
          at least {SPECIAL_ORDER_LEAD_DAYS} day ahead. We&apos;ll get back to you to confirm the price and
          availability before anything is baked.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          // Keyed by user so the contact fields refill if the account changes.
          <SpecialOrderForm key={user.id} user={user} />
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border px-6">
            <LogIn className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Sign in to order</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in or create an account to send a special order request.
            </p>
            <Button asChild>
              <Link href="/login?next=/special-order">Sign in or create an account</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

function SpecialOrderForm({ user }: { user: User }) {
  const { products } = useStore()
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    product: '',
    quantityChoice: '',
    otherQuantity: '',
    neededBy: '',
    fulfillment: 'pickup' as 'pickup' | 'delivery',
    notes: '',
  })
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  // The page is prerendered, so "today" is only known in the browser; the
  // server re-checks the date either way.
  const earliestDate = useSyncExternalStore(noSubscription, () => earliestSpecialOrderDate(), () => undefined)
  const isOtherQuantity = form.quantityChoice === OTHER_QUANTITY
  const quantity = Number(isOtherQuantity ? form.otherQuantity : form.quantityChoice)
  const selectedProduct = products.find(product => product.name === form.product)
  const estimatedTotal =
    selectedProduct &&
    Number.isInteger(quantity) &&
    quantity >= SPECIAL_ORDER_MINIMUM &&
    quantity <= SPECIAL_ORDER_MAXIMUM
      ? selectedProduct.price * quantity
      : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSending) return

    if (!form.product) {
      toast.error('Please choose what you would like.')
      return
    }
    if (!form.quantityChoice) {
      toast.error('Please choose a quantity.')
      return
    }

    // The hidden honeypot field is read straight from the form; people never fill it.
    const website = new FormData(e.currentTarget).get('website')

    setIsSending(true)
    try {
      const res = await fetch('/api/special-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          product: form.product,
          quantity,
          neededBy: form.neededBy,
          fulfillment: form.fulfillment,
          notes: form.notes,
          website,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')

      setSent(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-16 bg-card rounded-xl border border-border px-6">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-foreground font-medium mb-1">Request sent!</p>
        <p className="text-sm text-muted-foreground mb-6">
          We&apos;ll reach out to confirm your order. Questions? Contact us at {SHOP_EMAIL} or {SHOP_PHONE}.
        </p>
        <Button asChild>
          <Link href="/">Back to the shop</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-xl border border-border p-6">
      <fieldset className="space-y-4">
        <legend className="font-semibold text-foreground mb-2">Your order</legend>

        <div>
          <label htmlFor="special-product" className="block text-sm font-medium text-foreground mb-2">
            What would you like?
          </label>
          <Select value={form.product} onValueChange={value => setForm(s => ({ ...s, product: value }))}>
            <SelectTrigger id="special-product" className="w-full bg-secondary">
              <SelectValue placeholder={products.length ? 'Choose a bread' : 'Loading the menu…'} />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.name}>
                  {product.name} — ₱{product.price.toFixed(2)}/pc
                </SelectItem>
              ))}
              <SelectItem value={OTHER_PRODUCT}>{OTHER_PRODUCT}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <p id="special-quantity-label" className="block text-sm font-medium text-foreground mb-2">
            How many pieces?
          </p>
          <RadioGroup
            aria-labelledby="special-quantity-label"
            value={form.quantityChoice}
            onValueChange={value => setForm(s => ({ ...s, quantityChoice: value }))}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {SPECIAL_ORDER_PRESETS.map(preset => (
              <label
                key={preset}
                htmlFor={`qty-${preset}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                  form.quantityChoice === String(preset)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <RadioGroupItem value={String(preset)} id={`qty-${preset}`} />
                <span className="font-medium text-foreground">{preset}</span>
              </label>
            ))}
            {/* The number box sits beside the label, not inside it: inside, some
                browsers (Safari especially) pass a tap on the box to the radio,
                which takes the focus and leaves the box impossible to type in. */}
            <div
              className={cn(
                'col-span-2 sm:col-span-4 flex flex-wrap items-center gap-3 p-3 rounded-xl border-2 transition-all',
                isOtherQuantity ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}
            >
              <label htmlFor="qty-others" className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value={OTHER_QUANTITY} id="qty-others" />
                <span className="font-medium text-foreground">Others</span>
              </label>
              <Input
                id="qty-others-amount"
                type="number"
                inputMode="numeric"
                aria-label="Number of pieces (please specify)"
                min={SPECIAL_ORDER_MINIMUM}
                max={SPECIAL_ORDER_MAXIMUM}
                step={1}
                placeholder={`Please specify (${SPECIAL_ORDER_MINIMUM} or more)`}
                value={form.otherQuantity}
                onFocus={() => setForm(s => ({ ...s, quantityChoice: OTHER_QUANTITY }))}
                onChange={e => setForm(s => ({ ...s, quantityChoice: OTHER_QUANTITY, otherQuantity: e.target.value }))}
                required={isOtherQuantity}
                onKeyDown={e => e.stopPropagation()}
                className="flex-1 min-w-48 bg-secondary"
              />
            </div>
          </RadioGroup>
        </div>

        {form.product && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-secondary" aria-live="polite">
            <div>
              <p className="text-sm font-medium text-foreground">Estimated total</p>
              <p className="text-xs text-muted-foreground">
                {!selectedProduct
                  ? 'We’ll quote you a price for this item'
                  : estimatedTotal !== null
                    ? `${quantity} × ₱${selectedProduct.price.toFixed(2)} · final price confirmed by the bakery`
                    : isOtherQuantity
                      ? `₱${selectedProduct.price.toFixed(2)} per piece · enter ${SPECIAL_ORDER_MINIMUM} or more pieces to see your total`
                      : `₱${selectedProduct.price.toFixed(2)} per piece · choose how many to see your total`}
              </p>
            </div>
            <p className="text-xl font-bold text-primary whitespace-nowrap">
              {estimatedTotal !== null ? `₱${estimatedTotal.toFixed(2)}` : '—'}
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="special-date" className="block text-sm font-medium text-foreground mb-2">
              Needed by
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
              <Input
                id="special-date"
                type="date"
                min={earliestDate}
                value={form.neededBy}
                onChange={e => setForm(s => ({ ...s, neededBy: e.target.value }))}
                required
                className="pl-9 bg-secondary"
              />
            </div>
          </div>

          <div>
            <p id="special-fulfillment-label" className="block text-sm font-medium text-foreground mb-2">
              Pick-up or delivery?
            </p>
            <RadioGroup
              aria-labelledby="special-fulfillment-label"
              value={form.fulfillment}
              onValueChange={(value: 'pickup' | 'delivery') => setForm(s => ({ ...s, fulfillment: value }))}
              className="grid grid-cols-2 gap-3"
            >
              {([
                ['pickup', 'Pick-up', Store],
                ['delivery', 'Delivery', MapPin],
              ] as const).map(([value, label, Icon]) => (
                <label
                  key={value}
                  htmlFor={`fulfillment-${value}`}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all',
                    form.fulfillment === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  )}
                >
                  <RadioGroupItem value={value} id={`fulfillment-${value}`} />
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div>
          <label htmlFor="special-notes" className="block text-sm font-medium text-foreground mb-2">
            Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="special-notes"
            value={form.notes}
            onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
            placeholder="Mix of breads, packaging, delivery address, the occasion…"
            rows={4}
            maxLength={2000}
            className="bg-secondary resize-none"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-foreground mb-2">How we can reach you</legend>
        <div>
          <label htmlFor="special-name" className="block text-sm font-medium text-foreground mb-2">
            Your Name
          </label>
          <Input
            id="special-name"
            autoComplete="name"
            value={form.name}
            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
            required
            maxLength={100}
            className="bg-secondary"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="special-email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <Input
              id="special-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
              required
              className="bg-secondary"
            />
          </div>
          <div>
            <label htmlFor="special-phone" className="block text-sm font-medium text-foreground mb-2">
              Phone Number
            </label>
            <Input
              id="special-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={e => setForm(s => ({ ...s, phone: e.target.value }))}
              placeholder="0917 123 4567"
              required
              className="bg-secondary"
            />
          </div>
        </div>
      </fieldset>

      {/* Honeypot — hidden from people and screen readers, catches bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <Button type="submit" size="lg" disabled={isSending} className="w-full">
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Special Order Request'
        )}
      </Button>
    </form>
  )
}
