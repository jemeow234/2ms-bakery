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
  featured?: boolean
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
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

  return (
    <div
      className={cn(
        'group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2',
        featured && 'md:flex'
      )}
    >
      <div className={cn('relative overflow-hidden', featured ? 'md:w-1/2' : 'aspect-square')}>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {imageError ? (
          <div className="w-full h-full min-h-[200px] bg-secondary flex items-center justify-center">
            <span className="text-6xl text-primary/30">
              {product.category === 'bread' ? '🍞' : product.category === 'pastry' ? '🥐' : product.category === 'cake' ? '🎂' : '🍪'}
            </span>
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

      <div className={cn('p-6', featured && 'md:w-1/2 md:flex md:flex-col md:justify-center')}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-primary font-medium">
            {product.category}
          </span>
          <span className="font-serif text-xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 text-pretty">
          {product.description}
        </p>

        {product.ingredients && featured && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Ingredients:</span> {product.ingredients.join(', ')}
            </p>
          </div>
        )}

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
