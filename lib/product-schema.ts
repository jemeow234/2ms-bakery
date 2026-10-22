import { z } from 'zod'

// What an admin may set on a product. Anything else in the request (id,
// timestamps, a stale stock count from an open edit dialog) is dropped.
const productFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000),
  price: z.number().nonnegative().max(100000),
  category: z.enum(['without_palaman', 'with_palaman']),
  // Uploaded images are https URLs; bundled ones are paths under /public.
  image: z.string().trim().max(2048).regex(/^(\/|https:\/\/)/),
  featured: z.boolean(),
}

/** New product: everything, including its opening stock. */
export const createProductSchema = z.object({
  ...productFields,
  stock: z.number().int().min(0).max(100000),
})

/**
 * Edit: any subset, but never stock — that goes through
 * /api/admin/inventory so every change is logged and can't overwrite a sale.
 */
export const updateProductSchema = z.object(productFields).partial()
