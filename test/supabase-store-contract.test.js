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
  assert.match(source, /indexedDB/)
  assert.doesNotMatch(source, /const pendingStorage = globalThis\.sessionStorage/)
  assert.match(source, /transaction\.addEventListener\('complete', \(\) => \{[\s\S]+resolve\(requestResult\)/)
  assert.match(source, /transaction\.addEventListener\('abort', \(\) => \{[\s\S]+reject/)
  assert.match(source, /avatar_url/)
  assert.match(source, /profile:profiles![^(]+\(full_name,avatar_url\)/)
})

test('trainer photo is persisted before Auth and retained until upload fully succeeds', async () => {
  const events = []
  let pending = null
  let uploadFails = true
  const pendingAvatarStore = {
    async set(value) { events.push('pending:set'); pending = value },
    async get() { return pending },
    async remove() { events.push('pending:remove'); pending = null },
  }
  const profileRow = { id: 'trainer-1', full_name: 'Jan Trener', role: 'trainer', avatar_url: null }
  const client = {
    auth: {
      async signUp() { events.push('auth:signup'); return { data: { user: { id: 'trainer-1', email: 'jan@example.pl', user_metadata: { full_name: 'Jan Trener', role: 'trainer' } }, session: {} }, error: null } },
      async signInWithPassword() { return { data: { session: {} }, error: null } },
      async getUser() { return { data: { user: { id: 'trainer-1', email: 'jan@example.pl' } }, error: null } },
    },
    storage: {
      from() {
        return {
          async upload() { events.push('storage:upload'); return { error: uploadFails ? { message: 'upload failed' } : null } },
          getPublicUrl() { return { data: { publicUrl: 'https://example.test/profile.jpg' } } },
        }
      },
    },
    from() {
      return {
        select() { return { eq() { return { single: async () => ({ data: profileRow, error: null }) } } } },
        update() { return { eq: async () => ({ error: null }) } },
      }
    },
  }
  const store = createSupabaseStore(client, { pendingAvatarStore })
  const input = { fullName: 'Jan Trener', email: 'jan@example.pl', password: 'MocneHaslo123', role: 'trainer', acceptTerms: true, avatarDataUrl: 'data:image/jpeg;base64,YQ==' }

  await assert.rejects(() => store.signUp(input), /upload failed/)
  assert.deepEqual(events.slice(0, 3), ['pending:set', 'auth:signup', 'storage:upload'])
  assert.ok(pending)

  uploadFails = false
  const result = await store.signIn({ email: input.email, password: input.password })
  assert.equal(result.user.avatarUrl, 'https://example.test/profile.jpg')
  assert.equal(pending, null)
})

test('trainer registration stops before Auth when the pending photo cannot be persisted', async () => {
  let authCalls = 0
  const store = createSupabaseStore({ auth: { async signUp() { authCalls += 1; return { data: {}, error: null } } } }, {
    pendingAvatarStore: { async set() { throw new Error('photo persistence failed') } },
  })

  await assert.rejects(() => store.signUp({
    fullName: 'Jan Trener', email: 'jan@example.pl', password: 'MocneHaslo123', role: 'trainer', acceptTerms: true, avatarDataUrl: 'data:image/jpeg;base64,YQ==',
  }), /photo persistence failed/)
  assert.equal(authCalls, 0)
})
