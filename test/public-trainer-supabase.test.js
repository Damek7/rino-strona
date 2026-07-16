const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations')
const migrationName = fs.readdirSync(migrationDir).find(name => name.endsWith('_public_trainer_discovery.sql'))
const migration = fs.readFileSync(path.join(migrationDir, migrationName), 'utf8')
const storeSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'supabase-store.js'), 'utf8')

test('migration exposes only safe public columns under RLS', () => {
  assert.match(migration, /add column if not exists display_name text/i)
  assert.match(migration, /add column if not exists author_name text/i)
  assert.match(migration, /create table public\.trainer_media/i)
  assert.match(migration, /alter table public\.trainer_media enable row level security/i)
  assert.match(migration, /grant select on public\.trainer_media to anon, authenticated/i)
  assert.match(migration, /bucket_id = 'trainer-gallery'/)
  assert.match(migration, /drop policy if exists "Available published slots are public"/)
  assert.match(migration, /revoke select on public\.availability_slots from anon/i)
  assert.doesNotMatch(migration, /security definer/i)
})

test('migration restricts gallery writes to the owning trainer path', () => {
  assert.match(migration, /on public\.trainer_media for insert to authenticated[\s\S]+auth\.uid\(\)[\s\S]+trainer_id/i)
  assert.match(migration, /on storage\.objects for insert to authenticated[\s\S]+trainer-gallery[\s\S]+storage\.foldername\(name\)[\s\S]+auth\.uid\(\)::text/i)
  assert.match(migration, /on storage\.objects for update to authenticated[\s\S]+with check/i)
  assert.match(migration, /on storage\.objects for delete to authenticated/i)
})

test('public trainer queries select only duplicated safe identity fields', () => {
  const publicSelect = storeSource.match(/const publicTrainerSelect = '([^']+)'/)?.[1] || ''
  assert.match(publicSelect, /display_name,avatar_url/)
  assert.doesNotMatch(publicSelect, /profiles!/)
  assert.match(storeSource, /select\('id,trainer_id,rating,body,author_name,created_at'\)/)
})
