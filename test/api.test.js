const { test } = require('node:test')
const assert = require('node:assert/strict')
const { filterTrainers, qualificationStatus } = require('../lib/api')

test('filters trainers by discipline', () => {
  assert.equal(filterTrainers(new URL('http://local/?discipline=tenis')).length, 2)
})

test('classifies a ready Warsaw trainer as qualified', () => {
  assert.equal(qualificationStatus({
    city: 'Warszawa',
    capacity: 'three_to_five',
    readiness: ['profile', 'availability', 'bookings'],
  }), 'qualified')
})
