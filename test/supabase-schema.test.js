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

test('published profile grants never expose email or phone columns', () => {
  const grant = sql.match(/grant select \(([^)]+)\) on public\.profiles to authenticated/i)
  assert.ok(grant, 'authenticated profile select grant should be explicit')
  assert.doesNotMatch(grant[1], /\b(?:email|phone)\b/i)
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

test('availability overlap is enforced atomically and foreign-key lookups are indexed', () => {
  assert.match(sql, /create extension if not exists btree_gist/i)
  assert.match(sql, /exclude using gist[\s\S]+trainer_id with =[\s\S]+tstzrange\(starts_at, ends_at, '\[\)'\) with &&/i)
  for (const index of ['conversation_members_user_idx', 'messages_sender_idx', 'reviews_client_idx']) {
    assert.match(sql, new RegExp(`create index ${index}`, 'i'))
  }
})

test('only recipients can mark a message as read', () => {
  assert.match(sql, /Conversation members can mark messages read[\s\S]+sender_id\s*<>\s*\(select auth\.uid\(\)\)/i)
})

test('cancelled bookings release a slot for exactly one new active booking', () => {
  assert.doesNotMatch(sql, /slot_id uuid not null unique references public\.availability_slots/i)
  assert.match(sql, /create unique index bookings_active_slot_unique[\s\S]+on public\.bookings \(slot_id\)[\s\S]+where \(status <> 'cancelled'\)/i)
})

test('past slots cannot be published or booked and booked slots cannot be edited', () => {
  assert.match(sql, /starts_at <= now\(\)[\s\S]+slot must start in the future/i)
  assert.match(sql, /create trigger availability_validate_write before insert or update/i)
  assert.match(sql, /old\.status = 'booked'[\s\S]+booked slots cannot be changed/i)
  assert.match(sql, /selected_slot\.starts_at <= now\(\)[\s\S]+slot is in the past/i)
})

test('trainer avatar bucket is public while writes stay inside the trainer folder', () => {
  assert.match(sql, /insert into storage\.buckets[\s\S]+trainer-avatars[\s\S]+public/i)
  assert.match(sql, /on storage\.objects for select[\s\S]+bucket_id = 'trainer-avatars'/i)
  assert.match(sql, /on storage\.objects for insert[\s\S]+\(storage\.foldername\(name\)\)\[1\][\s\S]+auth\.uid\(\)::text/i)
  assert.match(sql, /on storage\.objects for update[\s\S]+with check[\s\S]+\(storage\.foldername\(name\)\)\[1\][\s\S]+auth\.uid\(\)::text/i)
  assert.match(sql, /on storage\.objects for delete[\s\S]+\(storage\.foldername\(name\)\)\[1\][\s\S]+auth\.uid\(\)::text/i)
  assert.match(sql, /role = 'trainer'/i)
  assert.match(sql, /profile\.jpg[\s\S]+profile\.png[\s\S]+profile\.webp/i)
})

test('trainer profiles cannot be published without an uploaded avatar', () => {
  assert.match(sql, /avatar_required boolean not null default false/i)
  assert.match(sql, /create function private\.validate_trainer_publish\(\)[\s\S]+avatar_required[\s\S]+bucket_id = 'trainer-avatars'[\s\S]+raise exception/i)
  assert.match(sql, /create trigger trainer_profiles_validate_publish[\s\S]+execute function private\.validate_trainer_publish\(\)/i)
  assert.match(sql, /create function private\.validate_profile_avatar\(\)[\s\S]+published[\s\S]+raise exception/i)
  assert.match(sql, /on storage\.objects for delete[\s\S]+not exists[\s\S]+trainer_profiles[\s\S]+published = true/i)
})
