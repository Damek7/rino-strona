# Public Client Trainer Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować publiczne wyszukiwanie i profile trenerów, przy czym konto klienta jest wymagane dopiero po kliknięciu „Zarezerwuj trening”.

**Architecture:** Zachować istniejącą aplikację vanilla JS i kontrakt dwóch adapterów danych. Czyste filtrowanie oraz sortowanie trafia do `panel-helpers.js`, publiczne dane do adapterów demo/Supabase, a `panel.js` zarządza formularzem, routingiem `#trainer/<id>`, galerią i zamiarem rezerwacji. Supabase przechowuje publiczną tożsamość trenera i bezpieczną nazwę autora opinii w publicznych tabelach chronionych RLS, bez funkcji `SECURITY DEFINER`.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Node.js 22 `node:test`, Supabase/PostgreSQL/RLS, Playwright 1.61.

## Global Constraints

- Warszawa jest jedynym miastem startowym; dzielnica pozostaje `disabled` przed wyborem miasta.
- Sortowanie jest ukryte przed pierwszym zatwierdzonym wyszukiwaniem.
- Dostępne sortowania: dopasowanie, najniższa cena, najwyższa cena, najlepsza średnia opinii, najwięcej opinii.
- Lista, galerie, opisy i opinie są publiczne; wolne terminy oraz rezerwacja wymagają konta klienta.
- Zachować obecne tokeny `#1C1B20`, `#C72562`, `#F6F3F0`, błękit Rino, Nunito Sans, promienie i cienie z `panel.css`.
- Inspiracje stosować wyłącznie zgodnie z nazwami folderów opisanymi w specyfikacji; nie kopiować brandingu ani całych sekcji 1:1.
- Nie dodawać frameworka, bundlera ani nowej zależności.
- Wszystkie interakcje muszą działać klawiaturą, mieć widoczny focus i respektować `prefers-reduced-motion`.
- Specyfikacja źródłowa: `docs/superpowers/specs/2026-07-16-public-client-trainer-discovery-design.md`.

---

## File map

- `lib/panel-helpers.js` — normalizacja filtrów, sortowanie i parsing publicznej trasy profilu.
- `lib/demo-store.js` — kompletne publiczne dane demo i metody profilu/opinii.
- `lib/supabase-store.js` — bezpośredni, ograniczony kolumnowo odczyt publicznych tabel pod RLS.
- `supabase/migrations/<generated>_public_trainer_discovery.sql` — bezpieczne kolumny publiczne, media, triggery, minimalne granty i polityki; nazwę tworzy CLI.
- `panel.html` — nowy formularz wyszukiwania, kontrolki wyników i publiczny widok profilu.
- `panel.css` — segmentowany pasek, karty zdjęciowe, galeria i responsywny profil.
- `panel.js` — stan wyszukiwania, routing, renderowanie i auth gate.
- `test/client-discovery-helpers.test.js` — czyste reguły filtrów, sortowania i tras.
- `test/public-trainer-demo.test.js` — publiczny kontrakt demo.
- `test/public-trainer-supabase.test.js` — zapytania Data API i prywatność kontraktu Supabase.
- `test/public-trainer-ui.test.js` — struktura HTML/CSS i bramka auth.
- `test/public-client-browser.test.js` — pełny przepływ w Chromium.
- `README.md` — opis publicznego katalogu i kont demonstracyjnych.

### Task 1: Search and sorting helpers

**Files:**
- Create: `test/client-discovery-helpers.test.js`
- Modify: `lib/panel-helpers.js`

**Interfaces:**
- Produces: `normalizeFilters(values)`, `sortTrainers(trainers, sort, q)`, `parsePanelHash(hash)`.
- `normalizeFilters` returns `{ city, district, discipline, q }`.
- `parsePanelHash` returns `{ route: 'trainer', trainerId }` or `{ route, trainerId: null }`.

- [ ] **Step 1: Write the failing helper tests**

```js
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
```

- [ ] **Step 2: Run the helper tests and verify failure**

Run: `node --test test/client-discovery-helpers.test.js`

Expected: FAIL because `sortTrainers` and `parsePanelHash` are not exported and `normalizeFilters` still returns `maxPrice`.

- [ ] **Step 3: Implement the helper contract**

```js
function normalizeFilters(values) {
  return {
    city: String(values.city || '').trim(),
    district: String(values.district || '').trim(),
    discipline: String(values.discipline || '').trim(),
    q: String(values.q || '').trim(),
  }
}

function relevanceScore(trainer, q) {
  const needle = String(q || '').trim().toLocaleLowerCase('pl')
  if (!needle) return 0
  const name = String(trainer.name || '').toLocaleLowerCase('pl')
  if (name === needle) return 4
  if (name.startsWith(needle)) return 3
  if (name.includes(needle)) return 2
  return 0
}

function sortTrainers(trainers, sort = 'relevance', q = '') {
  const items = [...trainers]
  const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'pl')
  const tieByReviews = (a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0) || byName(a, b)
  const comparators = {
    'price-asc': (a, b) => a.hourlyRate - b.hourlyRate || tieByReviews(a, b),
    'price-desc': (a, b) => b.hourlyRate - a.hourlyRate || tieByReviews(a, b),
    'rating-desc': (a, b) => b.rating - a.rating || tieByReviews(a, b),
    'reviews-desc': (a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating || byName(a, b),
    relevance: (a, b) => relevanceScore(b, q) - relevanceScore(a, q) || b.rating - a.rating || tieByReviews(a, b),
  }
  return items.sort(comparators[sort] || comparators.relevance)
}

function parsePanelHash(hash) {
  const value = String(hash || '').replace(/^#/, '')
  const match = value.match(/^trainer\/([a-z0-9-]{2,80})$/i)
  if (match) return { route: 'trainer', trainerId: match[1] }
  const route = ['discover', 'overview', 'calendar', 'bookings', 'clients', 'messages', 'earnings', 'profile', 'settings'].includes(value) ? value : 'discover'
  return { route, trainerId: null }
}
```

Add `sortTrainers` and `parsePanelHash` to the returned API object.

- [ ] **Step 4: Run helper and existing client tests**

Run: `node --test test/client-discovery-helpers.test.js test/client-flows.test.js`

Expected: PASS. Update the old `normalizeFilters` expectation in `test/client-flows.test.js` to the new `{ city, district, discipline, q }` contract.

- [ ] **Step 5: Commit**

```powershell
git add lib/panel-helpers.js test/client-discovery-helpers.test.js test/client-flows.test.js
git commit -m "feat: add trainer discovery sorting rules"
```

### Task 2: Public trainer contract in demo mode

**Files:**
- Create: `test/public-trainer-demo.test.js`
- Modify: `lib/demo-store.js`

**Interfaces:**
- Consumes: normalized filters from Task 1.
- Produces: `listTrainers(filters)`, `getPublicTrainer(id)`, `listTrainerReviews(id)`.
- Public trainer fields: `id`, `name`, `avatarUrl`, `bio`, `city`, `district`, `disciplines`, `hourlyRate`, `verified`, `rating`, `reviewCount`, `level`, `experience`, `specialties`, `gallery`.

- [ ] **Step 1: Write failing demo contract tests**

```js
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
```

- [ ] **Step 2: Run the demo tests and verify failure**

Run: `node --test test/public-trainer-demo.test.js`

Expected: FAIL because `getPublicTrainer`, `listTrainerReviews`, `city`, `gallery`, `experience` and `specialties` do not exist.

- [ ] **Step 3: Extend seed version and public data**

Set `version: 4`. Add `city: 'Warszawa'`, `experience`, `specialties` and `gallery` to all four published trainer profiles. Use only existing local assets:

```js
gallery: [
  { url: 'assets/trainer-tennis-editorial.png', alt: 'Trener tenisa podczas treningu na korcie', order: 0, isCover: true },
  { url: 'assets/tennis-back-serve.png', alt: 'Ćwiczenie serwisu tenisowego', order: 1, isCover: false },
  { url: 'assets/trainer-landing-tennis-back-serve.png', alt: 'Indywidualna lekcja tenisa', order: 2, isCover: false },
]
```

For the boxing profile use `assets/trainer-boxing-editorial.png` as cover. For Julia and Anna use the tennis editorial assets with truthful generic alt text. Add two public review records for each trainer using this shape:

```js
{ id: 'review-public-m-1', bookingId: null, clientId: null, trainerId: 'trainer-marek', rating: 5, body: 'Spokojne tłumaczenie i bardzo konkretne wskazówki. Po pierwszym treningu wiedziałam, nad czym pracować.', authorName: 'Katarzyna L.', createdAt: relativeIso(-18, 12) }
```

Keep `reviewCount` as the total marketplace count and the seeded list as the latest visible sample.

- [ ] **Step 4: Implement public methods and filtering**

```js
async function listTrainers(filters = {}) {
  const q = String(filters.q || '').trim().toLocaleLowerCase('pl')
  return state.trainerProfiles.filter(profile => profile.published).map(trainerDto).filter(trainer => {
    const name = trainer.name.toLocaleLowerCase('pl')
    return (!filters.city || trainer.city === filters.city)
      && (!filters.district || trainer.district === filters.district)
      && (!filters.discipline || trainer.disciplines.includes(filters.discipline))
      && (!q || name.includes(q))
  })
}

async function getPublicTrainer(id) {
  const profile = state.trainerProfiles.find(item => item.userId === id && item.published)
  return profile ? trainerDto(profile) : null
}

async function listTrainerReviews(id) {
  const profile = state.trainerProfiles.find(item => item.userId === id && item.published)
  if (!profile) return []
  return clone(state.reviews.filter(item => item.trainerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(item => ({
    id: item.id, trainerId: item.trainerId, rating: item.rating, body: item.body,
    authorName: item.authorName || `${state.users.find(user => user.id === item.clientId)?.fullName?.split(' ')[0] || 'Klient'} R.`,
    createdAt: item.createdAt,
  })))
}
```

Export both new methods in the store object.

- [ ] **Step 5: Run demo and regression tests**

Run: `node --test test/public-trainer-demo.test.js test/demo-store.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add lib/demo-store.js test/public-trainer-demo.test.js test/demo-store.test.js
git commit -m "feat: add public trainer profiles to demo mode"
```

### Task 3: Safe Supabase public directory

**Files:**
- Create with CLI: `supabase/migrations/<generated>_public_trainer_discovery.sql`
- Create: `test/public-trainer-supabase.test.js`
- Modify: `lib/supabase-store.js`
- Modify: `test/supabase-store-contract.test.js`
- Modify: `test/supabase-schema.test.js`

**Interfaces:**
- Produces public-safe columns on `trainer_profiles`, `reviews` and `trainer_media` protected by grants and RLS.
- Produces store methods with the same names and return shapes as Task 2.

- [ ] **Step 1: Write failing migration and store contract tests**

Create the migration filename first with `npx supabase migration new public_trainer_discovery`, then read that path dynamically in the test:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const migrationName = fs.readdirSync(path.join(__dirname, '..', 'supabase', 'migrations')).find(name => name.endsWith('_public_trainer_discovery.sql'))
const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', migrationName), 'utf8')

test('migration exposes only safe public columns under RLS', () => {
  assert.match(migration, /add column if not exists display_name text/i)
  assert.match(migration, /add column if not exists author_name text/i)
  assert.match(migration, /create table public\.trainer_media/i)
  assert.match(migration, /alter table public\.trainer_media enable row level security/i)
  assert.match(migration, /grant select on public\.trainer_media to anon, authenticated/i)
  assert.match(migration, /bucket_id = 'trainer-gallery'/)
  assert.match(migration, /drop policy if exists "Available published slots are public"/)
  assert.doesNotMatch(migration, /security definer/i)
})
```

Add a source-contract test for `lib/supabase-store.js` so the public query cannot regress to the private profile relationship:

```js
const storeSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'supabase-store.js'), 'utf8')

test('public trainer queries select only duplicated safe identity fields', () => {
  const publicSelect = storeSource.match(/const publicTrainerSelect = '([^']+)'/)?.[1] || ''
  assert.match(publicSelect, /display_name,avatar_url/)
  assert.doesNotMatch(publicSelect, /profiles!/)
  assert.match(storeSource, /select\('id,trainer_id,rating,body,author_name,created_at'\)/)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test test/public-trainer-supabase.test.js test/supabase-store-contract.test.js test/supabase-schema.test.js`

Expected: FAIL because the safe columns, media table and public store methods do not exist.

- [ ] **Step 3: Create the additive migration**

Use the exact CLI command from Step 1. The generated migration contains:

```sql
alter table public.trainer_profiles add column if not exists display_name text not null default 'Trener RinoMove';
alter table public.trainer_profiles add column if not exists avatar_url text;
alter table public.trainer_profiles add column if not exists city text not null default 'Warszawa';
alter table public.trainer_profiles add column if not exists experience text not null default '';
alter table public.trainer_profiles add column if not exists specialties text[] not null default '{}'::text[];
alter table public.reviews add column if not exists author_name text not null default 'Klient R.';

update public.trainer_profiles tp set display_name = p.full_name, avatar_url = p.avatar_url from public.profiles p where p.id = tp.user_id;

create table public.trainer_media (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(user_id) on delete cascade,
  url text not null check (char_length(url) between 1 and 2048),
  alt_text text not null check (char_length(alt_text) between 1 and 180),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (trainer_id, sort_order)
);

create unique index trainer_media_one_cover_idx on public.trainer_media (trainer_id) where is_cover;
create index trainer_profiles_public_search_idx on public.trainer_profiles (city, district) where published = true;
create index trainer_media_trainer_order_idx on public.trainer_media (trainer_id, sort_order);
alter table public.trainer_media enable row level security;

revoke all on public.trainer_media from anon, authenticated;
grant select on public.trainer_media to anon, authenticated;
grant insert, update, delete on public.trainer_media to authenticated;

create policy "Published trainer media are public" on public.trainer_media for select to anon, authenticated
  using (exists (select 1 from public.trainer_profiles tp where tp.user_id = trainer_media.trainer_id and tp.published = true));
create policy "Trainers insert own media" on public.trainer_media for insert to authenticated
  with check ((select auth.uid()) = trainer_id);
create policy "Trainers update own media" on public.trainer_media for update to authenticated
  using ((select auth.uid()) = trainer_id) with check ((select auth.uid()) = trainer_id);
create policy "Trainers delete own media" on public.trainer_media for delete to authenticated
  using ((select auth.uid()) = trainer_id);

drop policy if exists "Available published slots are public" on public.availability_slots;
create policy "Authenticated users can view published availability" on public.availability_slots for select to authenticated
  using (status = 'available' and exists (select 1 from public.trainer_profiles tp where tp.user_id = availability_slots.trainer_id and tp.published = true));
```

Add `security invoker` trigger functions in the private schema that copy `profiles.full_name/avatar_url` into the safe trainer columns and calculate `reviews.author_name` as first name plus last-name initial. Both triggers execute as the calling role and do not bypass RLS. Add a public `trainer-gallery` bucket with 5 MB JPEG/PNG/WebP restrictions. Storage policies must provide SELECT for published gallery objects plus owner SELECT/INSERT/UPDATE/DELETE for the trainer path so Storage `RETURNING` and upsert both work.

- [ ] **Step 4: Read safe tables in `supabase-store.js`**

```js
const publicTrainerSelect = 'user_id,display_name,avatar_url,bio,city,district,disciplines,hourly_rate,verified,published,rating,review_count,level,experience,specialties,gallery:trainer_media(id,url,alt_text,sort_order,is_cover)'
const publicTrainerDto = row => ({
  id: row.user_id, name: row.display_name, avatarUrl: row.avatar_url || null,
  bio: row.bio || '', city: row.city, district: row.district,
  disciplines: row.disciplines || [], hourlyRate: row.hourly_rate,
  verified: Boolean(row.verified), published: true, rating: Number(row.rating || 0),
  reviewCount: Number(row.review_count || 0), level: row.level || 'Każdy poziom',
  experience: row.experience || '', specialties: row.specialties || [],
  gallery: (row.gallery || []).sort((a, b) => a.sort_order - b.sort_order).map(item => ({ id: item.id, url: item.url, alt: item.alt_text, order: item.sort_order, isCover: item.is_cover })),
})

async function listTrainers(filters = {}) {
  let query = client.from('trainer_profiles').select(publicTrainerSelect).eq('published', true)
  if (filters.city) query = query.eq('city', filters.city)
  if (filters.district) query = query.eq('district', filters.district)
  if (filters.discipline) query = query.contains('disciplines', [filters.discipline])
  const { data, error } = await query.order('rating', { ascending: false })
  fail(error)
  const q = String(filters.q || '').toLocaleLowerCase('pl')
  return (data || []).map(publicTrainerDto).filter(item => !q || item.name.toLocaleLowerCase('pl').includes(q))
}

async function getPublicTrainer(id) {
  const { data, error } = await client.from('trainer_profiles').select(publicTrainerSelect).eq('published', true).eq('user_id', id).maybeSingle()
  fail(error)
  return data ? publicTrainerDto(data) : null
}

async function listTrainerReviews(id) {
  const { data, error } = await client.from('reviews').select('id,trainer_id,rating,body,author_name,created_at').eq('trainer_id', id).order('created_at', { ascending: false })
  fail(error)
  return (data || []).map(row => ({ id: row.id, trainerId: row.trainer_id, rating: row.rating, body: row.body, authorName: row.author_name, createdAt: row.created_at }))
}
```

Export both new methods. Keep private trainer editing on existing authenticated policies.

- [ ] **Step 5: Run Supabase tests**

Run: `node --test test/public-trainer-supabase.test.js test/supabase-store-contract.test.js test/supabase-schema.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add lib/supabase-store.js supabase/migrations test/public-trainer-supabase.test.js test/supabase-store-contract.test.js test/supabase-schema.test.js
git commit -m "feat: add safe public trainer directory"
```

### Task 4: Search and public profile markup/styles

**Files:**
- Create: `test/public-trainer-ui.test.js`
- Modify: `panel.html`
- Modify: `panel.css`

**Interfaces:**
- Produces DOM ids `city`, `district`, `discipline`, `searchQuery`, `resultControls`, `trainerSort`, `clearSearch`, `publicTrainerProfile`, `profileReserve`.

- [ ] **Step 1: Write failing structure tests**

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'panel.html'), 'utf8')
const css = fs.readFileSync(path.join(root, 'panel.css'), 'utf8')

test('search requires city before district and hides sort initially', () => {
  assert.match(html, /name="city"[\s\S]+value="Warszawa"/)
  assert.match(html, /name="district"[^>]+disabled/)
  assert.match(html, /id="resultControls"[^>]+hidden/)
  assert.match(html, /value="relevance"[\s\S]+value="price-asc"[\s\S]+value="price-desc"[\s\S]+value="rating-desc"[\s\S]+value="reviews-desc"/)
})

test('public trainer profile has gallery, content, reviews and reserve CTA', () => {
  assert.match(html, /data-route="trainer"/)
  for (const id of ['trainerGallery', 'publicTrainerName', 'publicTrainerBio', 'publicTrainerExperience', 'publicTrainerSpecialties', 'trainerReviews', 'profileReserve']) assert.match(html, new RegExp(`id="${id}"`))
})

test('new UI follows current tokens and responsive constraints', () => {
  assert.match(css, /\.filter-segment/)
  assert.match(css, /\.public-profile-layout/)
  assert.match(css, /\.trainer-gallery/)
  assert.match(css, /@media \(max-width: 820px\)[\s\S]+\.public-profile-layout/)
  assert.doesNotMatch(css, /transition:\s*all\b/)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test test/public-trainer-ui.test.js`

Expected: FAIL because the new fields and public profile do not exist.

- [ ] **Step 3: Replace the discovery form and add result controls**

Use this exact structure inside `view-discover`:

```html
<form class="filter-bar" id="searchForm">
  <label class="filter-segment"><span>Miasto</span><select name="city" id="city" required><option value="">Wybierz miasto</option><option value="Warszawa">Warszawa</option></select></label>
  <label class="filter-segment"><span>Dzielnica</span><select name="district" id="district" disabled><option value="">Najpierw wybierz miasto</option></select></label>
  <label class="filter-segment"><span>Sport</span><select name="discipline" id="discipline"><option value="">Każdy sport</option><option value="tenis">Tenis</option><option value="boks">Boks</option><option value="padel">Padel</option><option value="golf">Golf</option><option value="squash">Squash</option><option value="pływanie">Pływanie</option></select></label>
  <label class="filter-segment search-field"><span>Trener</span><svg aria-hidden="true"><use href="#icon-search"/></svg><input name="q" id="searchQuery" autocomplete="off" placeholder="Imię lub nazwisko"></label>
  <button class="button button--primary" type="submit">Znajdź trenera<svg aria-hidden="true"><use href="#icon-arrow"/></svg></button>
</form>
<div class="result-controls" id="resultControls" hidden>
  <p id="trainerCount"></p>
  <div><button class="text-button" id="clearSearch" type="button">Wyczyść filtry</button><label>Sortuj<select id="trainerSort"><option value="relevance">Dopasowanie</option><option value="price-asc">Najniższa cena</option><option value="price-desc">Najwyższa cena</option><option value="rating-desc">Najlepsza średnia opinii</option><option value="reviews-desc">Najwięcej opinii</option></select></label></div>
</div>
```

- [ ] **Step 4: Add the public profile view**

Add a `section.view[data-route="trainer"]` with a back button, `trainerGallery`, identity fields, `publicTrainerBio`, `publicTrainerExperience`, `publicTrainerSpecialties`, `trainerReviews`, price and `profileReserve`. Keep the CTA label exactly „Zarezerwuj trening”.

- [ ] **Step 5: Add CSS with current tokens**

```css
.filter-segment { min-width: 0; display: grid; gap: 3px; padding: 4px 14px; border-right: 1px solid var(--line); }
.filter-segment > span { color: var(--pink); font-size: 10px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.filter-segment input, .filter-segment select { min-height: 30px; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; font-weight: 800; }
.result-controls { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 18px 2px; }
.result-controls > div { display: flex; align-items: center; gap: 12px; }
.public-profile-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .38fr); gap: 18px; }
.trainer-gallery { display: grid; gap: 10px; }
.trainer-gallery-main { width: 100%; aspect-ratio: 16 / 10; overflow: hidden; border-radius: var(--radius-lg); background: var(--blue-wash); }
.trainer-gallery-main img { width: 100%; height: 100%; object-fit: cover; }
.trainer-gallery-thumbs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.trainer-gallery-thumbs button { overflow: hidden; padding: 0; border: 2px solid transparent; border-radius: 14px; background: var(--surface); }
.trainer-gallery-thumbs button.is-active { border-color: var(--pink); }
.trainer-gallery-thumbs img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.profile-booking-card { position: sticky; top: 98px; align-self: start; }
.review-list { display: grid; gap: 10px; }
.review-card { padding: 18px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
@media (max-width: 820px) { .public-profile-layout { grid-template-columns: 1fr; } .profile-booking-card { position: static; } }
```

Adjust the existing `.filter-bar` grid to four segments plus CTA, and preserve mobile stacking at 820 px and 540 px.

- [ ] **Step 6: Run UI and shell tests**

Run: `node --test test/public-trainer-ui.test.js test/panel-shell.test.js test/client-flows.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add panel.html panel.css test/public-trainer-ui.test.js test/panel-shell.test.js
git commit -m "feat: add public trainer discovery interface"
```

### Task 5: Discovery state, cards, profile routing and gallery

**Files:**
- Modify: `panel.js`
- Modify: `test/client-flows.test.js`
- Modify: `test/public-trainer-ui.test.js`

**Interfaces:**
- Consumes store methods from Tasks 2–3 and DOM from Task 4.
- Produces `renderDiscover`, `searchTrainers`, `openTrainerProfile`, `renderPublicTrainerProfile`.

- [ ] **Step 1: Add failing source-contract tests**

```js
test('panel keeps search results until submit and routes cards to profiles', () => {
  assert.match(panelSource, /hasSearched:\s*false/)
  assert.match(panelSource, /helpers\.sortTrainers/)
  assert.match(panelSource, /getPublicTrainer/)
  assert.match(panelSource, /listTrainerReviews/)
  assert.match(panelSource, /#trainer\/\$\{trainer\.id\}/)
  assert.doesNotMatch(panelSource, /Zobacz terminy/)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test test/client-flows.test.js test/public-trainer-ui.test.js`

Expected: FAIL on missing discovery/profile state and methods.

- [ ] **Step 3: Add discovery and profile state**

```js
Object.assign(state, {
  hasSearched: false,
  searchFilters: { city: '', district: '', discipline: '', q: '' },
  searchSort: 'relevance',
  searchResults: [],
  profileTrainerId: null,
  activeGalleryIndex: 0,
  pendingBookingTrainerId: null,
})
```

Keep `selectedTrainer` only for the authenticated calendar.

- [ ] **Step 4: Render discovery only after submit**

```js
function renderSearchResults() {
  const results = $('#trainerResults')
  if (!state.hasSearched) {
    $('#resultControls').hidden = true
    results.replaceChildren(emptyState('Wybierz miasto i znajdź trenera', 'Po wyszukaniu porównasz profile, ceny i opinie.'))
    return
  }
  $('#resultControls').hidden = false
  const trainers = helpers.sortTrainers(state.searchResults, state.searchSort, state.searchFilters.q)
  $('#trainerCount').textContent = trainers.length === 1 ? '1 dopasowany trener' : `${trainers.length} dopasowanych trenerów`
  results.replaceChildren()
  if (!trainers.length) {
    results.appendChild(emptyState('Brak dopasowań', 'Zmień dzielnicę, sport albo nazwisko trenera.'))
    return
  }
  trainers.forEach(trainer => results.appendChild(renderTrainerCard(trainer)))
}

async function searchTrainers() {
  state.searchFilters = helpers.normalizeFilters(Object.fromEntries(new FormData($('#searchForm'))))
  if (!state.searchFilters.city) throw new Error('Najpierw wybierz miasto.')
  state.searchResults = await state.store.listTrainers(state.searchFilters)
  state.hasSearched = true
  renderSearchResults()
}
```

`renderTrainerCard` must use 88 × 88 cover media, show rating/count/price and call `openTrainerProfile(trainer.id)` from the action labeled „Zobacz profil”.

- [ ] **Step 5: Implement hash routing and public profile rendering**

```js
async function openTrainerProfile(id) {
  state.profileTrainerId = id
  history.pushState(null, '', `#trainer/${id}`)
  await navigate('trainer', { fromHash: true, trainerId: id })
}

async function renderPublicTrainerProfile(id) {
  const [trainer, reviews] = await Promise.all([state.store.getPublicTrainer(id), state.store.listTrainerReviews(id)])
  const view = $('#publicTrainerProfile')
  if (!trainer) {
    view.replaceChildren(emptyState('Profil niedostępny', 'Trener mógł ukryć profil. Wróć do wyników wyszukiwania.'))
    return
  }
  state.profileTrainerId = trainer.id
  state.activeGalleryIndex = 0
  $('#publicTrainerName').textContent = trainer.name
  $('#publicTrainerBio').textContent = trainer.bio || 'Trener uzupełnia opis współpracy.'
  $('#publicTrainerExperience').textContent = trainer.experience || 'Doświadczenie zostanie uzupełnione.'
  $('#publicTrainerSpecialties').replaceChildren(...trainer.specialties.map(value => element('span', '', value)))
  renderTrainerGallery(trainer)
  renderTrainerReviews(trainer, reviews)
  $('#profileReserve').onclick = () => startBooking(trainer)
}
```

Implement gallery thumbnails as buttons that update the main image `src`, `alt`, active class and `state.activeGalleryIndex`. If gallery is empty, show initials in the existing blue surface.

Extend `navigate` and the `hashchange`/`init` handlers to use `helpers.parsePanelHash`. Route `trainer` is public and must not appear in sidebar navigation.

- [ ] **Step 6: Wire city, district, sort and clear controls**

On city change, clear and disable district when city is empty. For Warszawa, enable it and populate unique districts from `await state.store.listTrainers({ city: 'Warszawa' })`. On sort change, update `state.searchSort` and rerender without calling the store. Clear resets the form, disables district, hides sorting and restores the pre-search empty state.

- [ ] **Step 7: Run discovery tests**

Run: `node --test test/client-discovery-helpers.test.js test/client-flows.test.js test/public-trainer-ui.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add panel.js test/client-flows.test.js test/public-trainer-ui.test.js
git commit -m "feat: render public trainer profiles"
```

### Task 6: Account gate and booking intent resume

**Files:**
- Modify: `panel.js`
- Modify: `test/client-flows.test.js`
- Modify: `test/communication-flows.test.js`

**Interfaces:**
- Consumes `getPublicTrainer(id)`.
- Produces `startBooking(trainer)` and `resumePendingBooking(user)`.

- [ ] **Step 1: Write failing auth-gate tests**

```js
test('booking auth starts from profile CTA and resumes before availability', () => {
  assert.match(panelSource, /function startBooking\(trainer\)/)
  assert.match(panelSource, /pendingBookingTrainerId/)
  assert.match(panelSource, /setAuthMode\('register'\)/)
  assert.match(panelSource, /elements\.role\.value = 'client'/)
  assert.match(panelSource, /getPublicTrainer\(pendingTrainerId\)/)
  assert.doesNotMatch(panelSource, /if \(!state\.selectedTrainer\)[\s\S]{0,180}trainers\[0\]/)
  assert.doesNotMatch(panelSource, /if \(shouldResumeBooking\) openDialog\('bookingDialog'\)/)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test test/client-flows.test.js test/communication-flows.test.js`

Expected: FAIL because booking is currently gated only after selecting a slot.

- [ ] **Step 3: Implement profile CTA gate**

```js
async function startBooking(trainer) {
  if (state.user?.role === 'trainer') {
    showToast('Rezerwacja wymaga konta klienta.', 'error')
    return
  }
  if (!state.user) {
    state.pendingBookingTrainerId = trainer.id
    const form = $('#authForm')
    form.elements.role.value = 'client'
    setAuthMode('register')
    openDialog('authDialog')
    showToast('Załóż konto klienta lub zaloguj się, aby zobaczyć terminy.')
    return
  }
  state.selectedTrainer = trainer
  state.bookingFlowActive = true
  state.selectedDate = null
  state.weekAnchor = null
  await navigate('calendar')
}

async function resumePendingBooking(user) {
  const pendingTrainerId = state.pendingBookingTrainerId
  state.pendingBookingTrainerId = null
  if (!pendingTrainerId || user.role !== 'client') return false
  const trainer = await state.store.getPublicTrainer(pendingTrainerId)
  if (!trainer) {
    showToast('Profil trenera nie jest już dostępny.', 'error')
    await navigate('discover')
    return true
  }
  state.selectedTrainer = trainer
  state.bookingFlowActive = true
  await navigate('calendar')
  return true
}
```

- [ ] **Step 4: Restrict auth UI and calendar**

In `setAuthMode`, hide `roleField` when `state.pendingBookingTrainerId` is set and force client role. Do not require trainer photo in that context. After successful real or demo auth call `await resumePendingBooking(result.user)` before the normal role route. Do not reopen `bookingDialog`; the user must choose a slot after login. Remove the fallback that silently selects the first trainer in `renderCalendar`.

When the auth dialog is closed manually, clear `pendingBookingTrainerId` and restore the regular account-role field. Preserve the id on validation/server errors.

- [ ] **Step 5: Run booking and auth tests**

Run: `node --test test/client-flows.test.js test/communication-flows.test.js test/auth-route.test.js test/account-entry.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add panel.js test/client-flows.test.js test/communication-flows.test.js
git commit -m "feat: gate trainer booking behind client account"
```

### Task 7: Browser flow, documentation and full verification

**Files:**
- Create: `test/public-client-browser.test.js`
- Modify: `README.md`

**Interfaces:**
- Verifies all earlier tasks through the real server and Chromium.

- [ ] **Step 1: Write the end-to-end browser test**

```js
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { server } = require('../server')

let origin
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
})
after(async () => { await new Promise(resolve => server.close(resolve)) })

test('anonymous user searches, reads profile and authenticates only on reserve', async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${origin}/panel.html`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('#searchForm')
  assert.equal(await page.locator('#district').isDisabled(), true)
  assert.equal(await page.locator('#resultControls').isHidden(), true)
  await page.selectOption('#city', 'Warszawa')
  assert.equal(await page.locator('#district').isEnabled(), true)
  await page.selectOption('#discipline', 'tenis')
  await page.fill('#searchQuery', 'Marek')
  await page.click('#searchForm button[type="submit"]')
  await page.waitForSelector('.trainer-card')
  assert.equal(await page.locator('#resultControls').isVisible(), true)
  await page.selectOption('#trainerSort', 'reviews-desc')
  await page.getByRole('button', { name: 'Zobacz profil' }).first().click()
  await page.waitForSelector('#publicTrainerName')
  assert.match(await page.locator('#publicTrainerBio').textContent(), /trener/i)
  assert.ok(await page.locator('#trainerReviews .review-card').count() >= 2)
  assert.equal(await page.locator('#authDialog').evaluate(node => node.open), false)
  await page.click('#profileReserve')
  assert.equal(await page.locator('#authDialog').evaluate(node => node.open), true)
  assert.equal(await page.locator('#roleField').isHidden(), true)
  await page.getByRole('button', { name: 'Konto klienta' }).click()
  await page.waitForSelector('#view-calendar.is-active')
  assert.match(await page.locator('#calendarTitle').textContent(), /Marek Kowalski/)
  await browser.close()
})
```

- [ ] **Step 2: Run the browser test and fix only observed failures**

Run: `node --test test/public-client-browser.test.js`

Expected: PASS.

- [ ] **Step 3: Document the public flow**

Add to `README.md` under product scope:

```markdown
- publiczne wyszukiwanie trenerów po Warszawie, dzielnicy, sporcie i nazwisku,
- sortowanie wyników po cenie, średniej ocenie i liczbie opinii,
- publiczne profile z galerią, opisem i zweryfikowanymi opiniami,
- konto klienta wymagane dopiero przy przejściu do wolnych terminów i rezerwacji.
```

- [ ] **Step 4: Run the full automated suite**

Run: `npm test`

Expected: all tests pass, zero failures and zero cancelled tests.

- [ ] **Step 5: Run static checks**

Run: `git diff --check`

Expected: no output and exit code 0.

Run: `rg -n "Zobacz terminy|Cena maksymalna|Dowolna cena" panel.html panel.js`

Expected: no matches.

- [ ] **Step 6: Manually inspect desktop and mobile screenshots**

Start: `npm start`

Inspect `http://127.0.0.1:8787/panel.html` at 1440 × 1000 and 390 × 844. Verify no horizontal overflow, the city→district dependency, sort visibility, gallery controls, public reviews, sticky desktop booking card, mobile CTA, focus rings and reduced-motion behavior.

- [ ] **Step 7: Commit**

```powershell
git add test/public-client-browser.test.js README.md
git commit -m "test: verify public client trainer journey"
```

- [ ] **Step 8: Completion audit**

Match every requirement in `docs/superpowers/specs/2026-07-16-public-client-trainer-discovery-design.md` to code, tests, browser output or rendered screenshots. Treat a missing or indirect proof as incomplete and continue until every item has authoritative evidence.
