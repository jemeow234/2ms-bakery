'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'spotlight' | 'compact'
}

export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      toast.error('Not enough stock available')
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
          <span className="text-primary font-bold">₱{product.price.toFixed(2)}</span>
        </div>

        <Button
          size="icon"
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdded}
          className={cn(
            'shrink-0 transition-all duration-300',
            isAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'
          )}
          aria-label={`Add ${product.name} to cart`}
        >
          {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
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
            {product.category}
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-2 mt-1">
            {product.name}
          </h3>
          <p className="text-white/80 text-sm sm:text-base mb-5 max-w-md text-pretty">
            {product.description}
          </p>

          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-bold">₱{product.price.toFixed(2)}</span>
            <div className="flex items-center border border-white/30 rounded-lg ml-2">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 hover:bg-white/10 transition-colors rounded-l-lg"
                disabled={product.stock === 0}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-3 py-2 font-medium min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="p-2 hover:bg-white/10 transition-colors rounded-r-lg"
                disabled={product.stock === 0}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
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
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
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
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImageError(true)}
          />
        )}
        {product.featured && (
          <span className="absolute top-4 left-4 z-20 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            Featured
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-4 right-4 z-20 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-4 right-4 z-20 px-3 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
            Out of Stock
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-primary font-medium">
            {product.category}
          </span>
          <span className="font-serif text-xl font-bold text-primary">
            ₱{product.price.toFixed(2)}
          </span>
        </div>

        <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 text-pretty">
          {product.description}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-2 hover:bg-secondary transition-colors rounded-l-lg"
              disabled={product.stock === 0}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              className="p-2 hover:bg-secondary transition-colors rounded-r-lg"
              disabled={product.stock === 0}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdded}
            className={cn(
              'flex-1 transition-all duration-300',
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
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
