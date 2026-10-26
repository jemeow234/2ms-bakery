'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'
import { Plus, Minus, ShoppingBag, Check, ChevronRight } from 'lucide-react'
import { cn, formatCategory } from '@/lib/utils'
import { toast } from 'sonner'
import { ProductVariantModal } from '@/components/product-variant-modal'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'spotlight' | 'compact'
  // Options the customer picks between in a modal; see groupProductVariants.
  options?: Product[]
}

function stockLabel(stock: number) {
  return stock === 0 ? 'Out of stock' : `${stock} in stock`
}

export function ProductCard({ product, variant = 'grid', options = [] }: ProductCardProps) {
  const hasOptions = options.length > 1
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { items, addToCart } = useCart()

  const handleAddToCart = () => {
    if (hasOptions) {
      setOptionsOpen(true)
      return
    }
    const inCart = items.find(item => item.product.id === product.id)?.quantity ?? 0
    if (inCart + quantity > product.stock) {
      toast.error(
        inCart > 0
          ? `Only ${product.stock} ${product.name} left, and ${inCart} ${inCart === 1 ? 'is' : 'are'} already in your cart`
          : 'Not enough stock available'
      )
      return
    }
    addToCart(product, quantity)
    setIsAdded(true)
    toast.success(`Added ${quantity} ${product.name} to cart`)
    setTimeout(() => {
      setIsAdded(false)
      setQuantity(1)
    }, 1500)
  }

  const priceLabel = hasOptions ? `From ₱${product.price.toFixed(2)}` : `₱${product.price.toFixed(2)}`

  const optionsModal = hasOptions && (
    <ProductVariantModal
      open={optionsOpen}
      onOpenChange={setOptionsOpen}
      name={product.name}
      image={product.image}
      variants={options}
    />
  )

  if (variant === 'compact') {
    return (
      <div className="group flex items-center gap-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-3">
        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
          {imageError ? (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary/30" />
            </div>
          ) : (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-bold">{priceLabel}</span>
            <span className={cn('text-xs', product.stock === 0 ? 'text-destructive' : 'text-muted-foreground')}>
              {stockLabel(product.stock)}
            </span>
          </div>
        </div>

        <Button
          size="icon"
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdded}
          className={cn(
            'shrink-0 transition-all duration-300',
            isAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'
          )}
          aria-label={hasOptions ? `Choose ${product.name} option` : `Add ${product.name} to cart`}
        >
          {isAdded ? <Check className="h-4 w-4" /> : hasOptions ? <ChevronRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
        {optionsModal}
      </div>
    )
  }

  if (variant === 'spotlight') {
    return (
      <div className="group relative h-full min-h-[420px] rounded-2xl overflow-hidden shadow-2xl">
        {imageError ? (
          <div className="absolute inset-0 bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-primary/30" />
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 55vw, 90vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <span className="absolute top-5 left-5 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
          Signature Pick
        </span>

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
          <span className="text-xs uppercase tracking-wider text-white/70 font-medium">
            {formatCategory(product.category)}
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-2 mt-1">
            {product.name}
          </h3>
          <p className="text-white/80 text-sm sm:text-base mb-5 max-w-md text-pretty">
            {product.description}
          </p>
          <p className="text-white/70 text-sm mb-4">{stockLabel(product.stock)}</p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-serif text-2xl font-bold">{priceLabel}</span>
            {!hasOptions && (
              <div className="flex items-center border border-white/30 rounded-lg ml-2">
                <button aria-label="Decrease quantity"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 hover:bg-white/10 transition-colors rounded-l-lg"
                  disabled={product.stock === 0}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 py-2 font-medium min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button aria-label="Increase quantity"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="p-2 hover:bg-white/10 transition-colors rounded-r-lg"
                  disabled={product.stock === 0}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdded}
              className={cn(
                'transition-all duration-300',
                isAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'
              )}
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {hasOptions ? 'Choose Option' : 'Add to Cart'}
                </>
              )}
            </Button>
          </div>
        </div>
        {optionsModal}
      </div>
    )
  }

  return (
    <div className="group h-full flex flex-col bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl sm:hover:-translate-y-2">
      <div className="relative overflow-hidden aspect-square">
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {imageError ? (
          <div className="w-full h-full min-h-[200px] bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-primary/30" />
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImageError(true)}
          />
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 px-2 sm:px-3 py-0.5 sm:py-1 bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium rounded-full">
            Featured
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 right-2 sm:bottom-auto sm:top-4 sm:right-4 z-20 px-2 sm:px-3 py-0.5 sm:py-1 bg-accent text-accent-foreground text-[10px] sm:text-xs font-medium rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute bottom-2 right-2 sm:bottom-auto sm:top-4 sm:right-4 z-20 px-2 sm:px-3 py-0.5 sm:py-1 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-medium rounded-full">
            Out of Stock
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-3 sm:p-6">
        <div className="flex flex-col-reverse items-start gap-1 sm:flex-row sm:justify-between sm:gap-2 mb-1 sm:mb-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-primary font-medium">
            {formatCategory(product.category)}
          </span>
          <span className="font-serif text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
            {priceLabel}
          </span>
        </div>

        <h3 className="font-serif text-base sm:text-xl font-semibold text-foreground leading-snug mb-1 sm:mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Shown in full on every screen: the description lists the ingredients. */}
        <p className="text-muted-foreground text-xs sm:text-sm mb-2 text-pretty">
          {product.description}
        </p>

        <p className={cn('text-xs sm:text-sm font-medium mb-3 sm:mb-4', product.stock === 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {stockLabel(product.stock)}
        </p>

        {/* Pinned to the bottom so buttons line up across a row of cards. */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {!hasOptions && (
            <div className="flex items-center justify-between border border-border rounded-lg">
              <button aria-label="Decrease quantity"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2.5 sm:p-2 hover:bg-secondary transition-colors rounded-l-lg"
                disabled={product.stock === 0}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-2 sm:px-4 py-2 font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center">
                {quantity}
              </span>
              <button aria-label="Increase quantity"
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="p-2.5 sm:p-2 hover:bg-secondary transition-colors rounded-r-lg"
                disabled={product.stock === 0}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdded}
            className={cn(
              'flex-1 px-3 sm:px-4 transition-all duration-300',
              isAdded
                ? 'bg-green-600 hover:bg-green-600'
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Added!
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" />
                {hasOptions ? (
                  <>
                    {/* "Choose Option" doesn't fit a half-width phone card. */}
                    <span className="sm:hidden">Options</span>
                    <span className="hidden sm:inline">Choose Option</span>
                  </>
                ) : (
                  'Add to Cart'
                )}
              </>
            )}
          </Button>
        </div>
      </div>
      {optionsModal}
    </div>
  )
}
