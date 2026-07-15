const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createSupabaseStore } = require('../lib/supabase-store')

test('Supabase store exposes the same product contract as demo mode', () => {
  const store = createSupabaseStore({ auth: {} })
  for (const method of [
    'signUp', 'signIn', 'signOut', 'getSession', 'getDashboard', 'listTrainers',
    'listAvailability', 'createBooking', 'listBookings', 'updateBookingStatus',
    'listConversations', 'listMessages', 'sendMessage', 'setAvailability',
    'getEarnings', 'getPreferences', 'savePreferences', 'saveTrainerProfile',
    'listClients', 'createReview',
  ]) assert.equal(typeof store[method], 'function', `${method} should be a function`)
  assert.equal(store.mode, 'supabase')
})
