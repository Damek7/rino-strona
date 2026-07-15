const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { normalizeFilters, groupSlotsByDay, bookingSummary, navigationForRole, shiftWeek } = require('../lib/panel-helpers')

test('client filters convert visible zloty values to integer grosze', () => {
  assert.deepEqual(normalizeFilters({ q: ' Marek ', discipline: 'tenis', district: 'Mokotów', maxPrice: '220' }), {
    q: 'Marek', discipline: 'tenis', district: 'Mokotów', maxPrice: 22000,
  })
})

test('available slots are grouped by local calendar date', () => {
  const groups = groupSlotsByDay([
    { id: 'b', startsAt: '2026-07-16T17:00:00+02:00', status: 'available' },
    { id: 'a', startsAt: '2026-07-16T09:00:00+02:00', status: 'available' },
    { id: 'c', startsAt: '2026-07-17T09:00:00+02:00', status: 'booked' },
  ])
  assert.deepEqual(groups.map(group => [group.date, group.slots.map(slot => slot.id)]), [['2026-07-16', ['a', 'b']]])
})

test('UTC slots are grouped by the Warsaw calendar date', () => {
  const groups = groupSlotsByDay([
    { id: 'late', startsAt: '2026-07-15T22:30:00Z', status: 'available' },
  ])
  assert.equal(groups[0].date, '2026-07-16')
})

test('booking summary shows the exact trainer, slot and gross price', () => {
  assert.deepEqual(bookingSummary({ id: 't1', name: 'Marek', hourlyRate: 22000 }, { id: 's1', startsAt: '2026-07-16T09:00:00+02:00' }), {
    trainerId: 't1', trainerName: 'Marek', slotId: 's1', startsAt: '2026-07-16T09:00:00+02:00', price: 22000,
  })
})

test('calendar can move exactly one week in either direction', () => {
  assert.equal(shiftWeek('2026-07-15', 1).slice(0, 10), '2026-07-22')
  assert.equal(shiftWeek('2026-07-15', -1).slice(0, 10), '2026-07-08')
  assert.equal(shiftWeek(new Date('2026-07-15T12:00:00'), 1).slice(0, 10), '2026-07-22')
})

test('client navigation keeps calendar inside the booking flow', () => {
  assert.deepEqual(navigationForRole('client').map(item => item.route), ['discover', 'bookings', 'messages', 'settings'])
})

test('panel connects discovery and booking controls to store methods', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'panel.js'), 'utf8')
  assert.match(js, /store\.listTrainers/)
  assert.match(js, /store\.listAvailability/)
  assert.match(js, /store\.createBooking/)
  assert.match(js, /prevWeek/)
  assert.match(js, /nextWeek/)
  assert.match(js, /resumeBooking/)
  assert.match(js, /selectedTrainer[\s\S]+calendar/)
})
