const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  createWeek,
  canTransitionBooking,
  calculateEarnings,
  canReview,
  formatMoney,
} = require('../lib/domain')

test('createWeek returns seven local calendar days from Monday', () => {
  const week = createWeek('2026-07-15T12:00:00+02:00')

  assert.equal(week.length, 7)
  assert.equal(week[0].iso, '2026-07-13')
  assert.equal(week[6].iso, '2026-07-19')
  assert.equal(week[2].isToday, true)
})

test('booking transitions depend on the actor role', () => {
  assert.equal(canTransitionBooking('pending', 'confirmed', 'trainer'), true)
  assert.equal(canTransitionBooking('confirmed', 'completed', 'trainer'), true)
  assert.equal(canTransitionBooking('pending', 'completed', 'trainer'), false)
  assert.equal(canTransitionBooking('confirmed', 'cancelled', 'client'), true)
  assert.equal(canTransitionBooking('completed', 'cancelled', 'client'), false)
})

test('earnings includes only completed and paid bookings', () => {
  assert.deepEqual(calculateEarnings([
    { status: 'completed', paymentStatus: 'paid', price: 22000, platformFee: 2200 },
    { status: 'confirmed', paymentStatus: 'paid', price: 18000, platformFee: 1800 },
    { status: 'completed', paymentStatus: 'refunded', price: 17000, platformFee: 1700 },
  ]), { gross: 22000, fee: 2200, payout: 19800, count: 1 })
})

test('review requires one paid and completed booking', () => {
  const booking = { status: 'completed', paymentStatus: 'paid' }

  assert.equal(canReview(booking, null), true)
  assert.equal(canReview(booking, { id: 'review-1' }), false)
  assert.equal(canReview({ ...booking, status: 'confirmed' }, null), false)
})

test('formatMoney formats integer grosze in Polish currency', () => {
  assert.match(formatMoney(19800), /198/)
  assert.match(formatMoney(19800), /zł/)
})
