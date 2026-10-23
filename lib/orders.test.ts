import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapOrderRow, shortOrderNumber, type OrderRow } from './orders.ts'

const row: OrderRow = {
  id: '5f0c6a3e-2b1d-4c8e-9a7f-0123456789ab',
  customer_name: null,
  customer_email: 'test@example.com',
  customer_phone: null,
  address: null,
  delivery_type: 'pickup',
  status: 'pending',
  created_at: '2026-10-21T01:00:00Z',
  payment_method: 'gcash',
  total: '38.00',
  distance: null,
  delivery_date: '2026-10-22',
  delivery_session: '09:00',
  order_items: [
    { product_id: 'p1', product_name: 'Regular Pandesal', quantity: 4, price: '2.00' },
    { product_id: null, product_name: 'Discontinued Bun', quantity: 2, price: 15 },
  ],
}

test('numeric columns arrive as numbers', () => {
  const order = mapOrderRow(row)
  assert.equal(order.total, 38)
  assert.equal(order.items[0].product.price, 2)
})

test('items keep the name and price they were sold at', () => {
  const order = mapOrderRow(row)
  assert.deepEqual(
    order.items.map(item => [item.product.name, item.quantity]),
    [['Regular Pandesal', 4], ['Discontinued Bun', 2]]
  )
  assert.equal(order.items[1].product.id, '', 'a deleted product leaves an empty id')
})

test('missing values become empty strings or undefined, never null', () => {
  const order = mapOrderRow(row)
  assert.equal(order.customerName, '')
  assert.equal(order.distance, undefined)
  assert.equal(mapOrderRow({ ...row, order_items: null }).items.length, 0)
  assert.equal(mapOrderRow({ ...row, distance: '0.8' }).distance, 0.8)
})

test('the short order number is the last six characters, upper-cased', () => {
  assert.equal(shortOrderNumber(row.id), '6789AB')
})
