const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createSupabaseStore } = require('../lib/supabase-store')
const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'supabase-store.js'), 'utf8')

test('Supabase store exposes the same product contract as demo mode', () => {
  const store = createSupabaseStore({ auth: {} })
  for (const method of [
    'signUp', 'signIn', 'signOut', 'getSession', 'getDashboard', 'listTrainers',
    'listAvailability', 'createBooking', 'listBookings', 'updateBookingStatus',
    'listConversations', 'listMessages', 'sendMessage', 'markConversationRead', 'setAvailability',
    'getEarnings', 'getPreferences', 'savePreferences', 'getTrainerProfile', 'saveTrainerProfile',
    'listClients', 'createReview',
  ]) assert.equal(typeof store[method], 'function', `${method} should be a function`)
  assert.equal(store.mode, 'supabase')
})

test('Supabase registration validates terms before calling Auth', async () => {
  let calls = 0
  const store = createSupabaseStore({ auth: { signUp: async () => { calls += 1; return { data: {}, error: null } } } })

  await assert.rejects(() => store.signUp({
    fullName: 'Jan Trener', email: 'jan@example.pl', password: 'MocneHaslo123', role: 'trainer', acceptTerms: false,
  }), /Zaakceptuj/)
  assert.equal(calls, 0)
})

test('Supabase trainer registration requires a photo before calling Auth', async () => {
  let calls = 0
  const store = createSupabaseStore({ auth: { signUp: async () => { calls += 1; return { data: {}, error: null } } } })

  await assert.rejects(() => store.signUp({
    fullName: 'Jan Trener', email: 'jan@example.pl', password: 'MocneHaslo123', role: 'trainer', acceptTerms: true,
  }), /zdjęcie/i)
  assert.equal(calls, 0)
})

test('Supabase store uploads trainer avatars and preserves pending confirmation uploads', () => {
  assert.match(source, /client\.storage\.from\('trainer-avatars'\)\.upload/)
  assert.match(source, /pending-trainer-avatar/)
  assert.match(source, /avatar_url/)
  assert.match(source, /profile:profiles![^(]+\(full_name,avatar_url\)/)
})
