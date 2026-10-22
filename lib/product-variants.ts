import { Product } from '@/lib/types'

// Products named "Base (Option)" that share a base name, e.g. "Loaf Bread (Small)"
// and "Loaf Bread (Large)", are shown to customers as one card with a variant
// picker. Each option stays its own product so stock and orders are unchanged.
const VARIANT_NAME = /^(.+?)\s*\(([^)]+)\)$/

export interface ProductListing {
  key: string
  // What the card shows: the cheapest option, renamed to the base name, with the
  // options' stock summed. Only used for display; carts always get a variant.
  product: Product
  // Two or more options, cheapest first; empty for a plain product.
  variants: Product[]
}

export function variantLabel(product: Product): string {
  return product.name.match(VARIANT_NAME)?.[2] ?? product.name
}

export function groupProductVariants(products: Product[]): ProductListing[] {
  const byBase = new Map<string, Product[]>()
  for (const product of products) {
    const base = product.name.match(VARIANT_NAME)?.[1]
    if (base) byBase.set(base, [...(byBase.get(base) ?? []), product])
  }

  const listings: ProductListing[] = []
  const seen = new Set<string>()
  for (const product of products) {
    const base = product.name.match(VARIANT_NAME)?.[1]
    const group = base ? byBase.get(base)! : []

    // A lone "Star Bread (Putok)" is just a name with brackets, not a variant.
    if (!base || group.length < 2) {
      listings.push({ key: product.id, product, variants: [] })
      continue
    }
    if (seen.has(base)) continue
    seen.add(base)

    const variants = [...group].sort((a, b) => a.price - b.price)
    listings.push({
      key: `variants:${base}`,
      product: {
        ...variants[0],
        name: base,
        featured: variants.some(v => v.featured),
        stock: variants.reduce((sum, v) => sum + v.stock, 0),
      },
      variants,
    })
  }
  return listings
}
