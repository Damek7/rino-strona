const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { navigationForRole, bookingActions, validateAvailabilityInput } = require('../lib/panel-helpers')

test('trainer navigation includes operational and earnings routes', () => {
  assert.deepEqual(navigationForRole('trainer').map(item => item.route), ['overview', 'calendar', 'bookings', 'clients', 'messages', 'earnings', 'profile', 'settings'])
})

test('booking actions follow trainer and client status permissions', () => {
  assert.deepEqual(bookingActions({ status: 'pending' }, 'trainer'), ['confirmed', 'cancelled'])
  assert.deepEqual(bookingActions({ status: 'confirmed' }, 'trainer'), ['completed', 'cancelled'])
  assert.deepEqual(bookingActions({ status: 'confirmed' }, 'client'), ['cancelled'])
  assert.deepEqual(bookingActions({ status: 'completed' }, 'trainer'), [])
})

test('availability requires a positive time range', () => {
  const start = new Date(Date.now() + 86_400_000)
  const end = new Date(start.getTime() + 3_600_000)
  assert.deepEqual(validateAvailabilityInput(start.toISOString(), end.toISOString()), {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status: 'available',
  })
  assert.throws(() => validateAvailabilityInput(end.toISOString(), start.toISOString()), /późniejszy/)
  const past = new Date(Date.now() - 60_000)
  assert.throws(() => validateAvailabilityInput(past.toISOString(), new Date(past.getTime() + 3_600_000).toISOString()), /przyszłości/)
})

test('panel connects trainer views to availability, clients, earnings and profile data', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'panel.js'), 'utf8')
  for (const method of ['setAvailability', 'listClients', 'getEarnings', 'saveTrainerProfile', 'updateBookingStatus']) {
    assert.match(js, new RegExp(`store\\.${method}`))
  }
})
