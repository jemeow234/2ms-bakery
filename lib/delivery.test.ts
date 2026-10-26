import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HAS_BAKERY_LOCATION,
  bakeryTodayISO,
  calculateDistance,
  formatSchedule,
  formatSession,
  getSelectableSessions,
  isScheduleValid,
  sessionStartsAt,
} from './delivery.ts'

// The bakery runs on Manila time (UTC+8, no daylight saving).

test("today is Manila's date, not the server's", () => {
  // 17:00 UTC on the 20th is already 1 AM on the 21st in Manila.
  assert.equal(bakeryTodayISO(new Date('2026-10-20T17:00:00Z')), '2026-10-21')
  assert.equal(bakeryTodayISO(new Date('2026-10-20T15:59:00Z')), '2026-10-20')
})

test('a slot starts at its Manila time', () => {
  assert.equal(sessionStartsAt('2026-10-21', '09:00').toISOString(), '2026-10-21T01:00:00.000Z')
})

test('slots stay open until 15 minutes before they end', () => {
  // 8:30 AM in Manila: the 8:00 slot is in progress and can still be picked.
  const now = new Date('2026-10-21T00:30:00Z')
  assert.deepEqual(getSelectableSessions('2026-10-21', now), [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  ])
  // 4:44 PM: the last slot is still open; at 4:45 PM nothing is left.
  assert.deepEqual(getSelectableSessions('2026-10-21', new Date('2026-10-21T08:44:00Z')), ['16:00'])
  assert.deepEqual(getSelectableSessions('2026-10-21', new Date('2026-10-21T08:45:00Z')), [])
})

test('every slot is open on a future day, none on a past one', () => {
  const now = new Date('2026-10-21T00:30:00Z')
  assert.equal(getSelectableSessions('2026-10-22', now).length, 10)
  assert.deepEqual(getSelectableSessions('2026-10-20', now), [])
})

test('the server rejects what the checkout would disable', () => {
  const now = new Date('2026-10-21T00:30:00Z')
  assert.equal(isScheduleValid('2026-10-21', '08:00', now), true)
  assert.equal(isScheduleValid('2026-10-21', '07:00', now), false)
  assert.equal(isScheduleValid('2026-10-21', 'morning', now), false, 'legacy slots cannot be booked')
  assert.equal(isScheduleValid('21/10/2026', '11:00', now), false)
  assert.equal(isScheduleValid(undefined, undefined, now), false)
})

test('a few minutes of clock skew between browser and server is tolerated', () => {
  // 8:47 AM: the 8:00 slot closed two minutes ago, inside the 5-minute allowance.
  const now = new Date('2026-10-21T00:47:00Z')
  assert.equal(isScheduleValid('2026-10-21', '08:00', now), true)
  assert.equal(isScheduleValid('2026-10-21', '08:00', now, 0), false)
})

test('slots and legacy slots are formatted for people', () => {
  assert.equal(formatSession('07:00'), '7:00 AM – 8:00 AM')
  assert.equal(formatSession('12:00'), '12:00 PM – 1:00 PM')
  assert.equal(formatSession('morning'), 'Morning (8:00 AM – 11:00 AM)')
  const schedule = formatSchedule('2026-10-21', '09:00')
  assert.ok(schedule?.includes('2026') && schedule.endsWith('9:00 AM – 10:00 AM'), schedule ?? 'null')
  assert.equal(formatSchedule(null, '09:00'), null)
})

test('distances are great-circle kilometres', () => {
  assert.equal(calculateDistance(13.94, 121.16, 13.94, 121.16), 0)
  const oneDegree = calculateDistance(13, 121, 14, 121)
  assert.ok(Math.abs(oneDegree - 111.19) < 0.1, String(oneDegree))
  assert.equal(calculateDistance(13, 121, 14, 122), calculateDistance(14, 122, 13, 121))
})

test('without NEXT_PUBLIC_BAKERY_LAT/LNG there is no origin to measure from', () => {
  if (process.env.NEXT_PUBLIC_BAKERY_LAT || process.env.NEXT_PUBLIC_BAKERY_LNG) return
  assert.equal(HAS_BAKERY_LOCATION, false)
})
