const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createDemoStore } = require('../lib/demo-store')

function memoryStorage() {
  const data = new Map()
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}

test('public demo discovery works without a session', async () => {
  const store = createDemoStore(memoryStorage())
  const items = await store.listTrainers({ city: 'Warszawa', district: 'Śródmieście', discipline: 'tenis', q: 'Kowalski' })
  assert.equal(items.length, 1)
  assert.equal(items[0].name, 'Marek Kowalski')
  assert.equal(items[0].city, 'Warszawa')
})

test('public demo profile includes gallery, description and specialties', async () => {
  const store = createDemoStore(memoryStorage())
  const profile = await store.getPublicTrainer('trainer-marek')
  assert.ok(profile.gallery.length >= 2)
  assert.ok(profile.bio.length > 20)
  assert.ok(profile.experience.length > 20)
  assert.ok(profile.specialties.length >= 2)
  assert.equal('email' in profile, false)
})

test('public reviews expose safe names but no contact data', async () => {
  const store = createDemoStore(memoryStorage())
  const reviews = await store.listTrainerReviews('trainer-marek')
  assert.ok(reviews.length >= 2)
  assert.match(reviews[0].authorName, /^[\p{L}-]+ [\p{L}]\.$/u)
  assert.equal('email' in reviews[0], false)
})

test('hidden or missing demo profiles are not public', async () => {
  const store = createDemoStore(memoryStorage())
  assert.equal(await store.getPublicTrainer('missing'), null)
})
