const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createSupabaseStore } = require('../lib/supabase-store')

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
