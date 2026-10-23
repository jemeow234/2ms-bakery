import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createProductSchema, updateProductSchema } from './product-schema.ts'

const product = {
  name: 'Ube Pandesal',
  description: 'Soft purple yam rolls.',
  price: 8,
  category: 'without_palaman',
  image: '/images/ube_pandesal.jpg',
  featured: false,
  stock: 40,
}

test('a complete new product is accepted', () => {
  assert.equal(createProductSchema.safeParse(product).success, true)
})

test('editing never touches stock, ids or other unknown fields', () => {
  const parsed = updateProductSchema.parse({ ...product, id: 'abc', stock: 3, created_at: 'x' })
  assert.equal('stock' in parsed, false)
  assert.equal('id' in parsed, false)
  assert.equal('created_at' in parsed, false)
  assert.equal(parsed.name, 'Ube Pandesal')
})

test('bad values are refused', () => {
  assert.equal(createProductSchema.safeParse({ ...product, price: -1 }).success, false)
  assert.equal(createProductSchema.safeParse({ ...product, stock: 1.5 }).success, false)
  assert.equal(createProductSchema.safeParse({ ...product, category: 'cake' }).success, false)
  assert.equal(createProductSchema.safeParse({ ...product, name: '   ' }).success, false)
})

test('images must be site paths or https URLs', () => {
  assert.equal(updateProductSchema.safeParse({ image: 'https://x.supabase.co/storage/v1/object/public/a.jpg' }).success, true)
  assert.equal(updateProductSchema.safeParse({ image: 'javascript:alert(1)' }).success, false)
  assert.equal(updateProductSchema.safeParse({ image: 'http://example.com/a.jpg' }).success, false)
})
