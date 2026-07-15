# RinoMove Product MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować działające bez konfiguracji MVP RinoMove z kontami, kalendarzem, rezerwacjami, chatem, panelem trenera, zarobkami i gotowym połączeniem Supabase.

**Architecture:** Istniejący statyczny projekt pozostaje bez frameworka. Widoki korzystają ze wspólnego kontraktu danych, którego implementacją jest trwały magazyn demo albo Supabase wybierany na podstawie `/api/config`; czyste reguły domenowe nie zależą od DOM ani backendu.

**Tech Stack:** Node.js 22+, HTML5, CSS, CommonJS dla serwera/testów, ES modules w przeglądarce, `@supabase/supabase-js` 2.110.5, Node test runner, Playwright do końcowej kontroli UI.

## Global Constraints

- Aplikacja działa bez kluczy w oznaczonym trybie demo i automatycznie używa Supabase po ustawieniu `SUPABASE_URL` oraz `SUPABASE_PUBLISHABLE_KEY`.
- Żaden sekret ani klucz `service_role` nie trafia do przeglądarki lub repozytorium.
- RLS jest włączone na każdej tabeli w `public`; polityki sprawdzają właściciela/uczestnictwo, nie tylko rolę `authenticated`.
- Nie wdrażamy prawdziwego obciążenia karty/BLIK bez operatora; demo zapisuje realistyczne statusy płatności.
- Interfejs zachowuje markę: `#1C1B20`, `#C72562`, `#A9D4EA`, białe/ciepłe tła, minimum 40 px hit area, `prefers-reduced-motion` i brak `transition: all`.
- Zmiany ograniczają się do panelu, warstwy danych, Supabase, serwera, testów i dokumentacji uruchomienia.

---

### Task 1: Reguły domenowe i model demo

**Files:**
- Create: `lib/domain.js`
- Create: `lib/demo-store.js`
- Test: `test/domain.test.js`
- Test: `test/demo-store.test.js`

**Interfaces:**
- Produces: `createWeek(anchor)`, `canTransitionBooking(from,to,role)`, `calculateEarnings(bookings)`, `canReview(booking,existingReview)`, `createDemoStore(storage)`.
- `createDemoStore` returns async methods: `signUp`, `signIn`, `signOut`, `getSession`, `getDashboard`, `listTrainers`, `listAvailability`, `createBooking`, `listBookings`, `updateBookingStatus`, `listConversations`, `listMessages`, `sendMessage`, `setAvailability`, `getEarnings`, `getPreferences`, `savePreferences`, `saveTrainerProfile`, `createReview`.

- [ ] **Step 1: Write failing domain tests**

```js
test('trainer may complete only a confirmed booking', () => {
  assert.equal(canTransitionBooking('confirmed', 'completed', 'trainer'), true)
  assert.equal(canTransitionBooking('pending', 'completed', 'trainer'), false)
})

test('earnings separates gross, fee and payout', () => {
  assert.deepEqual(calculateEarnings([{ status: 'completed', paymentStatus: 'paid', price: 22000, platformFee: 2200 }]), {
    gross: 22000, fee: 2200, payout: 19800, count: 1,
  })
})
```

- [ ] **Step 2: Run RED**

Run: `node --test test/domain.test.js test/demo-store.test.js`
Expected: FAIL because `lib/domain.js` and `lib/demo-store.js` do not exist.

- [ ] **Step 3: Implement minimal domain and seeded demo store**

Use integer grosze for money, ISO timestamps for dates, UUIDs from `crypto.randomUUID()` when available, and one versioned key `rino-demo-v1`. Seed a client, trainer, available slots, two bookings, one conversation and messages. Every mutation persists before resolving.

```js
function calculateEarnings(bookings) {
  return bookings.filter(item => item.status === 'completed' && item.paymentStatus === 'paid')
    .reduce((sum, item) => ({ gross: sum.gross + item.price, fee: sum.fee + item.platformFee,
      payout: sum.payout + item.price - item.platformFee, count: sum.count + 1 }),
    { gross: 0, fee: 0, payout: 0, count: 0 })
}
```

- [ ] **Step 4: Run GREEN**

Run: `node --test test/domain.test.js test/demo-store.test.js`
Expected: PASS with no warnings.

### Task 2: Supabase dependency, public configuration and complete schema

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.env.example`
- Create: `lib/supabase-config.js`
- Create: `lib/supabase-store.js`
- Create: `lib/app-store.js`
- Create: `supabase/migrations/20260715120000_product_mvp.sql`
- Modify: `server.js`
- Test: `test/supabase-config.test.js`
- Test: `test/supabase-schema.test.js`

**Interfaces:**
- Produces: `publicConfig(env) -> { mode, supabaseUrl?, publishableKey? }`.
- Produces browser global `createSupabaseStore(client)` implementing the Task 1 store contract.
- `/api/config` exposes only public values; `/vendor/supabase.js` serves the pinned local UMD bundle.

- [ ] **Step 1: Write failing config and schema-contract tests**

```js
test('missing public Supabase values selects demo mode', () => {
  assert.deepEqual(publicConfig({}), { mode: 'demo' })
})

test('every exposed product table enables RLS', () => {
  for (const table of ['profiles','trainer_profiles','availability_slots','bookings','conversations','conversation_members','messages','reviews','notification_preferences']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
  }
})
```

- [ ] **Step 2: Run RED**

Run: `node --test test/supabase-config.test.js test/supabase-schema.test.js`
Expected: FAIL because configuration, store and migration are absent.

- [ ] **Step 3: Pin Supabase and implement public config**

Run: `npm install --save-exact @supabase/supabase-js@2.110.5`
Expected: lockfile records exactly `2.110.5`.

Implement `GET /api/config` with `Cache-Control: no-store`, serve only the UMD file below a fixed `/vendor/supabase.js` path, and remove local JSON password/session storage from `server.js`.

- [ ] **Step 4: Create one idempotent migration**

Create the tables, constraints, indexes and policies from the spec. Use `TO authenticated`, `(select auth.uid())`, `USING` plus `WITH CHECK` on updates, a private profile trigger with fixed empty `search_path`, and a unique `reviews(booking_id)`. Add tables used by Realtime to `supabase_realtime` publication only if not already present.

- [ ] **Step 5: Implement Supabase store**

Map auth to `signUp`, `signInWithPassword`, `signOut`, `getUser`; map each store method to RLS-protected `from(...).select/insert/update`. Return the same camelCase DTOs as demo store so UI has no backend conditionals.

- [ ] **Step 6: Run GREEN**

Run: `node --test test/supabase-config.test.js test/supabase-schema.test.js`
Expected: PASS; `npm ls @supabase/supabase-js` shows `2.110.5`.

### Task 3: Role-aware application shell and accounts

**Files:**
- Replace: `panel.html`
- Create: `panel.css`
- Modify: `panel.js`
- Test: `test/panel-shell.test.js`
- Test: `test/account-entry.test.js`

**Interfaces:**
- Consumes: `createAppStore()` from Task 2.
- Produces: hash routes `#discover`, `#calendar`, `#bookings`, `#messages`, `#overview`, `#clients`, `#earnings`, `#profile`, `#settings`.

- [ ] **Step 1: Write failing shell tests**

Assert semantic landmarks, dialog labels, separate client/trainer navigation templates, demo badge, live status region, module scripts and the absence of inline style blocks and Unicode characters used as navigation icons.

- [ ] **Step 2: Run RED**

Run: `node --test test/panel-shell.test.js test/account-entry.test.js`
Expected: FAIL against the current single-role inline-styled panel.

- [ ] **Step 3: Build the application shell and auth dialog**

Use inline SVG symbols with `currentColor`, render navigation by role, preserve landing links `panel.html#register` and `panel.html?role=trainer#register`, validate name/email/password/terms before store calls, restore session on load, and show actionable auth errors without clearing the form.

- [ ] **Step 4: Style shell responsively**

Desktop uses a 248 px rail and spacious content canvas. Mobile uses a five-item bottom navigation plus `Więcej` drawer for secondary destinations. Every focus state is visible; button press uses `scale(.96)`; headings use balanced wrapping and monetary metrics use tabular numbers.

- [ ] **Step 5: Run GREEN**

Run: `node --test test/panel-shell.test.js test/account-entry.test.js`
Expected: PASS.

### Task 4: Client discovery, calendar and booking lifecycle

**Files:**
- Modify: `panel.html`
- Modify: `panel.js`
- Modify: `panel.css`
- Test: `test/client-flows.test.js`

**Interfaces:**
- Consumes: trainer, availability and booking store methods.
- Produces: trainer filters, selected trainer state, week navigation, booking confirmation dialog and booking status cards.

- [ ] **Step 1: Write failing client-flow tests**

Test that discipline/district/price filters map to a store query, unavailable slots cannot be booked, booking confirmation shows price before creation, and a new booking appears with `confirmed`/`paid` demo statuses.

- [ ] **Step 2: Run RED**

Run: `node --test test/client-flows.test.js`
Expected: FAIL because modular client flow helpers are missing.

- [ ] **Step 3: Implement minimal client flow**

Render trainer cards from data (no hard-coded HTML), update availability on trainer/week selection, require an authenticated client before final confirmation, then route to the new booking. Expose reschedule/cancel only for statuses that allow it.

- [ ] **Step 4: Run GREEN**

Run: `node --test test/client-flows.test.js test/demo-store.test.js`
Expected: PASS.

### Task 5: Trainer overview, availability, clients and earnings

**Files:**
- Modify: `panel.html`
- Modify: `panel.js`
- Modify: `panel.css`
- Test: `test/trainer-flows.test.js`

**Interfaces:**
- Consumes: dashboard, availability, booking, earnings and profile store methods.
- Produces: KPI cards, week agenda, availability editor, booking action menu, client history, earnings summary and trainer profile form.

- [ ] **Step 1: Write failing trainer-flow tests**

Test trainer-only route visibility, rejecting overlapping availability, valid booking transitions, unique client aggregation and earnings computed only from paid/completed bookings.

- [ ] **Step 2: Run RED**

Run: `node --test test/trainer-flows.test.js`
Expected: FAIL because trainer helpers and views are missing.

- [ ] **Step 3: Implement trainer tools**

Overview shows today, pending actions, month revenue and next payout. Calendar supports adding and blocking slots. Booking cards expose confirm/cancel/complete according to domain rules. Clients are derived from bookings. Earnings show gross, platform fee, payout and a transaction table; profile edit persists bio, disciplines, district and price.

- [ ] **Step 4: Run GREEN**

Run: `node --test test/trainer-flows.test.js test/domain.test.js test/demo-store.test.js`
Expected: PASS.

### Task 6: Chat, reminders and verified reviews

**Files:**
- Modify: `panel.html`
- Modify: `panel.js`
- Modify: `panel.css`
- Test: `test/communication-flows.test.js`

**Interfaces:**
- Consumes: conversation, message, preferences and review store methods.
- Produces: conversation list, message composer, unread state, preference switches and review dialog.

- [ ] **Step 1: Write failing communication tests**

Test trimmed non-empty messages, HTML displayed as text, participant-only conversations in store, persisted reminder switches, and review creation allowed once only for paid/completed bookings.

- [ ] **Step 2: Run RED**

Run: `node --test test/communication-flows.test.js`
Expected: FAIL because communication helpers are missing.

- [ ] **Step 3: Implement communication UI**

Render message bodies with `textContent`, optimistically append only after store success, scroll the active thread, poll in demo-neutral intervals when Realtime is unavailable, persist switches immediately and show review CTA only when `canReview` is true.

- [ ] **Step 4: Run GREEN**

Run: `node --test test/communication-flows.test.js test/demo-store.test.js`
Expected: PASS.

### Task 7: Documentation, accessibility and full verification

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`
- Modify: existing panel tests only where the approved product behavior replaced prototype assumptions.

**Interfaces:**
- Documents exact demo credentials, Supabase setup and migration command without exposing secrets.

- [ ] **Step 1: Update README and ignore rules**

Document `npm install`, `npm start`, demo client/trainer accounts, `.env.example`, migration location, and what remains external (payment operator, email/SMS provider). Ignore `.env`, Supabase temp files and runtime data while preserving `.env.example`.

- [ ] **Step 2: Run static verification**

Run: `npm test`
Expected: all tests pass with zero failures.

Run: `git diff --check`
Expected: no whitespace errors.

Run: `npm ls --depth=0`
Expected: dependency tree is valid and Supabase is pinned.

- [ ] **Step 3: Run server verification**

Run server on port 8787, then request `/api/health`, `/api/config`, `/panel.html` and `/vendor/supabase.js`.
Expected: health 200, config `{ "mode": "demo" }` without env, panel 200, vendor JS 200.

- [ ] **Step 4: Browser-check client and trainer flows**

At desktop width: register/login client, filter trainers, book a slot, send a message and inspect booking. Log in as trainer, add availability, complete a confirmed booking, inspect earnings and save profile. At mobile width: repeat navigation, open dialogs, calendar and chat composer. Inspect console errors and keyboard focus.

- [ ] **Step 5: Final requirements audit**

Compare every requirement in `docs/superpowers/specs/2026-07-15-rinomove-product-mvp-design.md` with code, tests and browser evidence. Do not claim completion if any explicit flow, RLS requirement or no-config behavior lacks direct evidence.
