const { test } = require('node:test')
const assert = require('node:assert/strict')
const { normalizeFilters, sortTrainers, parsePanelHash } = require('../lib/panel-helpers')

const trainers = [
  { id: 'a', name: 'Anna Sowa', hourlyRate: 24000, rating: 4.9, reviewCount: 31 },
  { id: 'm', name: 'Marek Kowalski', hourlyRate: 22000, rating: 4.9, reviewCount: 38 },
  { id: 'p', name: 'Paweł Wrona', hourlyRate: 18000, rating: 5, reviewCount: 19 },
]

test('normalizes public search fields without price filtering', () => {
  assert.deepEqual(normalizeFilters({ city: ' Warszawa ', district: ' Mokotów ', discipline: 'tenis', q: ' Kowalski ' }), {
    city: 'Warszawa', district: 'Mokotów', discipline: 'tenis', q: 'Kowalski',
  })
})

test('sorts by price and review signals with deterministic tie breakers', () => {
  assert.deepEqual(sortTrainers(trainers, 'price-asc').map(item => item.id), ['p', 'm', 'a'])
  assert.deepEqual(sortTrainers(trainers, 'price-desc').map(item => item.id), ['a', 'm', 'p'])
  assert.deepEqual(sortTrainers(trainers, 'rating-desc').map(item => item.id), ['p', 'm', 'a'])
  assert.deepEqual(sortTrainers(trainers, 'reviews-desc').map(item => item.id), ['m', 'a', 'p'])
})

test('relevance prefers an exact or prefix name match', () => {
  assert.equal(sortTrainers(trainers, 'relevance', 'Marek')[0].id, 'm')
})

test('parses public trainer hashes without accepting malformed ids', () => {
  assert.deepEqual(parsePanelHash('#trainer/trainer-marek'), { route: 'trainer', trainerId: 'trainer-marek' })
  assert.deepEqual(parsePanelHash('#trainer/%2F'), { route: 'discover', trainerId: null })
  assert.deepEqual(parsePanelHash('#discover'), { route: 'discover', trainerId: null })
})
