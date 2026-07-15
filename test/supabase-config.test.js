const { test } = require('node:test')
const assert = require('node:assert/strict')
const { publicConfig } = require('../lib/supabase-config')

test('missing public Supabase values selects demo mode', () => {
  assert.deepEqual(publicConfig({}), { mode: 'demo' })
  assert.deepEqual(publicConfig({ SUPABASE_URL: 'https://example.supabase.co' }), { mode: 'demo' })
})

test('complete public Supabase values select Supabase without exposing secrets', () => {
  assert.deepEqual(publicConfig({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public',
    SUPABASE_SERVICE_ROLE_KEY: 'never-return-this',
  }), {
    mode: 'supabase',
    supabaseUrl: 'https://example.supabase.co',
    publishableKey: 'sb_publishable_public',
  })
})

test('invalid Supabase URL safely falls back to demo mode', () => {
  assert.deepEqual(publicConfig({
    SUPABASE_URL: 'javascript:alert(1)',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public',
  }), { mode: 'demo' })
})
