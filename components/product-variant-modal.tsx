'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { useCart } from '@/context/cart-context'
import { variantLabel } from '@/lib/product-variants'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Minus, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductVariantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  image: string
  variants: Product[]
  // Where the chosen option goes. Defaults to the customer's cart; the POS
  // passes its own. Return false to keep the picker open (e.g. not enough stock).
  onAdd?: (variant: Product, quantity: number) => boolean | void
}

export function ProductVariantModal({ open, onOpenChange, ...picker }: ProductVariantModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Mounted only while open, so each opening starts fresh. */}
        <VariantPicker {...picker} onAdded={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function VariantPicker({
  name,
  image,
  variants,
  onAdd,
  onAdded,
}: Omit<ProductVariantModalProps, 'open' | 'onOpenChange'> & { onAdded: () => void }) {
  // Start on the first option that can actually be bought.
  const [selectedId, setSelectedId] = useState(
    () => (variants.find(v => v.stock > 0) ?? variants[0])?.id
  )
  const [quantity, setQuantity] = useState(1)
  const [imageError, setImageError] = useState(false)
  const { addToCart } = useCart()

  const selected = variants.find(v => v.id === selectedId)

  const selectVariant = (variant: Product) => {
    setSelectedId(variant.id)
    setQuantity(q => Math.max(1, Math.min(q, variant.stock)))
  }

  const handleAddToCart = () => {
    if (!selected) return
    if (selected.stock < quantity) {
      toast.error('Not enough stock available')
      return
    }
    if (onAdd) {
      if (onAdd(selected, quantity) !== false) onAdded()
      return
    }
    addToCart(selected, quantity)
    toast.success(`Added ${quantity} ${selected.name} to cart`)
    onAdded()
  }

  return (
    <>
    <div className="relative aspect-[4/3] bg-secondary">
      {imageError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="h-12 w-12 text-primary/30" />
        </div>
      ) : (
        <Image
          src={selected?.image ?? image}
          alt={name}
          fill
          sizes="(min-width: 640px) 448px, 100vw"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>

    <div className="p-6">
      <DialogHeader className="mb-4">
        <DialogTitle className="font-serif text-2xl">{name}</DialogTitle>
        <DialogDescription className="text-pretty">
          {selected?.description ?? 'Choose an option.'}
        </DialogDescription>
      </DialogHeader>

      <div role="radiogroup" aria-label={`${name} options`} className="grid gap-2 mb-5">
        {variants.map(variant => {
          const isSelected = variant.id === selectedId
          const soldOut = variant.stock === 0
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={soldOut}
              onClick={() => selectVariant(variant)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40',
                soldOut && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border',
                    isSelected ? 'border-primary' : 'border-muted-foreground/40'
                  )}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div>
                  <div className="font-medium text-foreground">{variantLabel(variant)}</div>
                  <div className="text-xs text-muted-foreground">
                    {soldOut ? 'Out of stock' : `${variant.stock} in stock`}
                  </div>
                </div>
              </div>
              <span className="font-serif text-lg font-bold text-primary">
                ₱{variant.price.toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-border rounded-lg">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="p-2 hover:bg-secondary transition-colors rounded-l-lg"
            disabled={!selected || selected.stock === 0}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(q => Math.min(selected?.stock ?? 1, q + 1))}
            className="p-2 hover:bg-secondary transition-colors rounded-r-lg"
            disabled={!selected || selected.stock === 0}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!selected || selected.stock === 0}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Add to Cart
          {selected && ` · ₱${(selected.price * quantity).toFixed(2)}`}
        </Button>
      </div>
    </div>
    </>
  )
}
