import { test } from 'node:test'
import assert from 'node:assert/strict'
import { earliestSpecialOrderDate, parseSpecialOrder } from './special-order.ts'

// 2026-10-21 09:00 in Manila
const now = new Date('2026-10-21T01:00:00Z')

const valid = {
  name: 'Juan Dela Cruz',
  email: 'juan@example.com',
  phone: '+63 917 123 4567',
  product: 'Regular Pandesal',
  quantity: 100,
  neededBy: '2026-10-24',
  fulfillment: 'pickup',
  notes: '',
}

test('earliest date is the lead time after today in Manila', () => {
  assert.equal(earliestSpecialOrderDate(now), '2026-10-24')
  // 23:30 UTC is already the next day in Manila
  assert.equal(earliestSpecialOrderDate(new Date('2026-10-21T23:30:00Z')), '2026-10-25')
  // crosses a month end
  assert.equal(earliestSpecialOrderDate(new Date('2026-10-30T01:00:00Z')), '2026-11-02')
})

test('accepts a preset quantity', () => {
  const result = parseSpecialOrder(valid, now)
  assert.equal(result.ok, true)
})

test('accepts an "others" quantity above the minimum', () => {
  assert.equal(parseSpecialOrder({ ...valid, quantity: 75 }, now).ok, true)
})

test('rejects quantities below the minimum', () => {
  const result = parseSpecialOrder({ ...valid, quantity: 49 }, now)
  assert.equal(result.ok, false)
  assert.match(!result.ok ? result.error : '', /start at 50/)
})

test('rejects fractional and missing quantities', () => {
  assert.equal(parseSpecialOrder({ ...valid, quantity: 60.5 }, now).ok, false)
  assert.equal(parseSpecialOrder({ ...valid, quantity: undefined }, now).ok, false)
})

test('rejects dates inside the lead time', () => {
  const result = parseSpecialOrder({ ...valid, neededBy: '2026-10-23' }, now)
  assert.equal(result.ok, false)
  assert.match(!result.ok ? result.error : '', /2026-10-24/)
})

test('rejects a bad email or phone', () => {
  assert.equal(parseSpecialOrder({ ...valid, email: 'nope' }, now).ok, false)
  assert.equal(parseSpecialOrder({ ...valid, phone: 'call me' }, now).ok, false)
})
