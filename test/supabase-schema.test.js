const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations')
const migration = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).find(name => name.endsWith('_product_mvp.sql'))
  : null
const sql = migration ? fs.readFileSync(path.join(migrationDir, migration), 'utf8') : ''
const tables = [
  'profiles',
  'trainer_profiles',
  'availability_slots',
  'bookings',
  'conversations',
  'conversation_members',
  'messages',
  'reviews',
  'notification_preferences',
]

test('product migration exists and enables RLS on every exposed table', () => {
  assert.ok(migration, 'product_mvp migration should exist')
  for (const table of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `${table} should enable RLS`)
  }
})

test('migration explicitly grants Data API access and avoids deprecated auth.role', () => {
  assert.match(sql, /grant select[\s\S]+to anon/i)
  assert.match(sql, /grant select[\s\S]+to authenticated/i)
  assert.match(sql, /grant insert[\s\S]+to authenticated/i)
  assert.doesNotMatch(sql, /grant all/i)
  assert.doesNotMatch(sql, /auth\.role\s*\(/i)
})

test('ownership policies use auth uid and update checks', () => {
  assert.match(sql, /\(select auth\.uid\(\)\)/i)
  assert.match(sql, /on public\.profiles[\s\S]+for update[\s\S]+using[\s\S]+with check/i)
  assert.match(sql, /on public\.bookings[\s\S]+for update[\s\S]+using[\s\S]+with check/i)
})

test('reviews are unique per booking and validated from completed paid bookings', () => {
  assert.match(sql, /booking_id uuid not null unique/i)
  assert.match(sql, /status\s*(?:=|<>)\s*'completed'/i)
  assert.match(sql, /payment_status\s*(?:=|<>)\s*'paid'/i)
})

test('private trigger functions are not callable by public roles', () => {
  assert.match(sql, /create schema if not exists private/i)
  assert.match(sql, /revoke all on function private\.create_profile_for_new_user\(\) from public/i)
  assert.match(sql, /revoke all on function private\.prepare_booking\(\) from public/i)
  assert.doesNotMatch(sql, /create\s+(or replace\s+)?function\s+public\.[^(]+[\s\S]+security definer/i)
})

test('message table is included in the Realtime publication idempotently', () => {
  assert.match(sql, /supabase_realtime/i)
  assert.match(sql, /messages/i)
  assert.match(sql, /duplicate_object/i)
})
