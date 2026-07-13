# Supabase Auth i chroniony panel RinoMove Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podłączyć RinoMove do projektu Supabase `gbsvphzastgcsjvqiqwd`, zastąpić lokalne konta i udostępnić panel wyłącznie zalogowanym osobom.

**Architecture:** Serwer Node.js obsłuży rejestrację, logowanie i odświeżanie sesji przez `@supabase/supabase-js`, zapisując tokeny w ciasteczkach HttpOnly. Warstwa SQL w Supabase utworzy profile użytkowników, trigger rejestracji i RLS. Panel użyje lokalnego API do odtworzenia stanu konta, a serwer nie zwróci HTML panelu bez zweryfikowanej sesji.

**Tech Stack:** Node.js 20, `@supabase/supabase-js`, Supabase Auth, Postgres, RLS, `node:test`.

## Global Constraints

- Projekt Supabase: `gbsvphzastgcsjvqiqwd` (`https://gbsvphzastgcsjvqiqwd.supabase.co`).
- Używaj wyłącznie klucza publicznego w pliku `.env`; nigdy `service_role` ani hasła bazy w kodzie lub przeglądarce.
- Role użytkowników: dokładnie `client` oraz `trainer`.
- `profiles.role` nie może być zmieniany przez użytkownika po rejestracji.
- Tabele w schemacie `public` muszą mieć włączone RLS i polityki właściciela.
- Nie dodawaj frameworka ani bundlera; zachowaj obecny Node.js + HTML/JS.

---

## File Structure

- `package.json` — zależność klienta Supabase i komendy testowe.
- `package-lock.json` — zablokowane wersje zależności.
- `.env.example` — nazwy wymaganych zmiennych bez sekretów.
- `.gitignore` — wykluczenie lokalnego `.env` i starego katalogu `data/`.
- `lib/supabase.js` — klient Supabase i walidacja konfiguracji.
- `lib/auth.js` — ciasteczka sesji, weryfikacja użytkownika i kontrakty odpowiedzi auth.
- `server.js` — trasy auth, ochrona `/panel.html`, usunięcie lokalnych użytkowników/sesji.
- `panel.js` — komunikacja z lokalnymi trasami auth oraz obsługa komunikatu po potwierdzeniu e-maila.
- `supabase/migrations/<timestamp>_profiles.sql` — profile, trigger, RLS, uprawnienia.
- `test/auth.test.js` — testy zachowania ciasteczek i wejścia na chronioną stronę.
- `test/server.test.js` — testy HTTP tras, z rzeczywistą weryfikacją sesji przez klienta testowego Supabase.

### Task 1: Konfiguracja i kontrakt klienta Supabase

**Files:**
- Create: `.env.example`
- Create: `lib/supabase.js`
- Modify: `package.json`
- Create: `test/supabase-config.test.js`

**Interfaces:**
- Produces: `createSupabaseClient(): SupabaseClient`.
- Produces: `requireSupabaseEnv(env): { url: string, publishableKey: string }`.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const { requireSupabaseEnv } = require('../lib/supabase')

test('requires both Supabase environment values', () => {
  assert.throws(() => requireSupabaseEnv({}), /SUPABASE_URL/)
  assert.deepEqual(requireSupabaseEnv({
    SUPABASE_URL: 'https://gbsvphzastgcsjvqiqwd.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  }), {
    url: 'https://gbsvphzastgcsjvqiqwd.supabase.co',
    publishableKey: 'sb_publishable_test',
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/supabase-config.test.js`

Expected: FAIL because `../lib/supabase` does not exist.

- [ ] **Step 3: Install and lock the dependency**

Run: `npm install @supabase/supabase-js@2`

Expected: `package.json` and `package-lock.json` contain a pinned v2 dependency.

- [ ] **Step 4: Write the minimal configuration module**

```js
"use strict"
const { createClient } = require('@supabase/supabase-js')

function requireSupabaseEnv(env = process.env) {
  const url = String(env.SUPABASE_URL || '').trim()
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  if (!url) throw new Error('SUPABASE_URL is required')
  if (!publishableKey) throw new Error('SUPABASE_PUBLISHABLE_KEY is required')
  return { url, publishableKey }
}

function createSupabaseClient(env = process.env) {
  const { url, publishableKey } = requireSupabaseEnv(env)
  return createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

module.exports = { createSupabaseClient, requireSupabaseEnv }
```

Create `.env.example`:

```dotenv
SUPABASE_URL=https://gbsvphzastgcsjvqiqwd.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_project_key
COOKIE_SECURE=false
```

- [ ] **Step 5: Verify and commit**

Run: `node --test test/supabase-config.test.js`

Expected: PASS.

Run: `git add package.json package-lock.json .env.example lib/supabase.js test/supabase-config.test.js && git commit -m "chore: add Supabase client configuration"`

### Task 2: Profile schema and row-level security

**Files:**
- Create: `supabase/migrations/<timestamp>_profiles.sql`

**Interfaces:**
- Consumes: `auth.users.id`, `raw_user_meta_data.full_name`, `raw_user_meta_data.role`.
- Produces: `public.profiles(id uuid, full_name text, role text, accepted_terms_at timestamptz, created_at timestamptz)`.

- [ ] **Step 1: Write the SQL migration before applying it**

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  role text not null check (role in ('client', 'trainer')),
  accepted_terms_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create schema if not exists private;
create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, accepted_terms_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'role',
    (new.raw_user_meta_data ->> 'accepted_terms_at')::timestamptz
  );
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

grant usage on schema public to authenticated;
grant select (id, full_name, role, accepted_terms_at, created_at) on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "Users read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users update own name"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
```

- [ ] **Step 2: Apply the draft SQL to the connected project and inspect it**

Run the migration SQL with the Supabase SQL execution tool against `gbsvphzastgcsjvqiqwd`.

Expected: `profiles`, trigger and both policies are created without errors.

- [ ] **Step 3: Verify RLS with two test accounts**

Run two separate authenticated queries:

```sql
select id, full_name, role from public.profiles;
update public.profiles set full_name = 'Nowa nazwa' where id = auth.uid();
```

Expected: each account returns only one row; its own name can change; changing `role` is denied by the column grant.

- [ ] **Step 4: Run security review and commit**

Run the Supabase security advisor for `gbsvphzastgcsjvqiqwd`.

Expected: no advisory caused by `profiles`, policies or the trigger remains unresolved.

Run: `git add supabase/migrations && git commit -m "feat: add protected user profiles"`

### Task 3: Server-owned Supabase session routes

**Files:**
- Create: `lib/auth.js`
- Modify: `server.js`
- Create: `test/auth.test.js`

**Interfaces:**
- Produces: `readSessionCookies(req): { accessToken?: string, refreshToken?: string }`.
- Produces: `sessionCookieHeaders(session): string[]`.
- Produces: `getAuthenticatedUser(req, supabase): Promise<{ user: { id: string, email: string } } | null>`.
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/refresh`.

- [ ] **Step 1: Write failing cookie tests**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const { readSessionCookies, sessionCookieHeaders } = require('../lib/auth')

test('writes HttpOnly session cookies and reads them back', () => {
  const headers = sessionCookieHeaders({ access_token: 'access', refresh_token: 'refresh' })
  assert.equal(headers.length, 2)
  assert.match(headers[0], /HttpOnly/)
  assert.match(headers[0], /SameSite=Lax/)
  assert.deepEqual(readSessionCookies({ headers: { cookie: 'rino-access=access; rino-refresh=refresh' } }), {
    accessToken: 'access', refreshToken: 'refresh',
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/auth.test.js`

Expected: FAIL because `../lib/auth` does not exist.

- [ ] **Step 3: Implement cookie helpers and authenticated user lookup**

```js
function getAuthenticatedUser(req, supabase) {
  const { accessToken } = readSessionCookies(req)
  if (!accessToken) return Promise.resolve(null)
  return supabase.auth.getUser(accessToken).then(({ data, error }) => {
    if (error || !data.user) return null
    return { user: { id: data.user.id, email: data.user.email } }
  })
}
```

Use `supabase.auth.signUp({ email, password, options: { data: { full_name, role, accepted_terms_at } } })` for registration and `signInWithPassword({ email, password })` for login. Set both cookies only when the response includes a session. Clear both on logout with `Max-Age=0`.

- [ ] **Step 4: Replace local authentication in `server.js`**

Delete `DATA`, `USERS`, `SESSIONS`, `hashPassword`, `passwordMatches`, `sessionUser`, and `createSession`. Route every auth request through the Supabase client. Preserve current Polish validation messages and return `409` only when Supabase reports an already-registered e-mail. Return `202` with `{ needsEmailConfirmation: true }` when sign-up yields no session.

Add the route guard before static file serving:

```js
if (url.pathname === '/panel.html') {
  const auth = await getAuthenticatedUser(req, supabase)
  if (!auth) {
    res.writeHead(303, { Location: '/index.html?auth=login' })
    return res.end()
  }
}
```

- [ ] **Step 5: Verify and commit**

Run: `node --test test/auth.test.js test/supabase-config.test.js`

Expected: PASS.

Run: `git add lib/auth.js server.js test/auth.test.js && git commit -m "feat: authenticate panel sessions with Supabase"`

### Task 4: Użycie chronionego API w panelu

**Files:**
- Modify: `panel.js`
- Modify: `panel.html`
- Create: `test/panel-auth.test.js`

**Interfaces:**
- Consumes: `GET /api/auth/me` returns `{ user: { id, email }, profile: { full_name, role } }`.
- Consumes: `POST /api/auth/refresh` returns `200` and renewed cookies or `401`.
- Produces: `restoreSession(): Promise<void>` and unauthenticated redirect to `/index.html?auth=login`.

- [ ] **Step 1: Write the failing browser-state test**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const { accountLabel } = require('../panel')

test('uses profile name and role for an authenticated account label', () => {
  assert.equal(accountLabel({ full_name: 'Anna Nowak', role: 'trainer' }), 'Cześć, Anna')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/panel-auth.test.js`

Expected: FAIL because `accountLabel` is not exported.

- [ ] **Step 3: Make the panel use cookies rather than localStorage**

Replace the current `api()` implementation with a `fetch` call using `credentials: 'same-origin'`; remove every `localStorage.getItem`, `setItem`, and `removeItem` for `rino-token`. On a `401`, call `POST /api/auth/refresh` once and retry the original request; if refresh fails, redirect to `/index.html?auth=login`.

```js
const api = async (path, options = {}) => {
  const send = () => fetch(path, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  let response = await send()
  if (response.status === 401 && path !== '/api/auth/refresh') {
    const renewed = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
    if (renewed.ok) response = await send()
  }
  const data = await response.json().catch(() => ({ error: 'Błąd odpowiedzi serwera' }))
  if (!response.ok) throw new Error(data.error || 'Wystąpił błąd')
  return data
}
```

Update account rendering to use `profile.full_name` and `profile.role`. For `202` registration, keep the dialog open and show: `Sprawdź skrzynkę e-mail, aby potwierdzić konto.`

- [ ] **Step 4: Verify and commit**

Run: `node --test test/panel-auth.test.js`

Expected: PASS.

Run: `git add panel.js panel.html test/panel-auth.test.js && git commit -m "feat: use protected Supabase panel sessions"`

### Task 5: End-to-end verification and migration cleanup

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `.env` with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `COOKIE_SECURE`.
- Produces: installation and test instructions without private values.

- [ ] **Step 1: Write a failing HTTP protection test**

```js
test('redirects an anonymous request for the panel to login', async () => {
  const response = await fetch(`${baseUrl}/panel.html`, { redirect: 'manual' })
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), '/index.html?auth=login')
})
```

- [ ] **Step 2: Run test to verify it fails before the route guard exists**

Run: `node --test test/server.test.js`

Expected: FAIL because anonymous `/panel.html` currently returns `200`.

- [ ] **Step 3: Run all automated checks after implementing Tasks 1–4**

Run: `npm test`

Expected: PASS with no failing tests.

- [ ] **Step 4: Run the live acceptance checks**

1. Start the app with `npm start` and open `http://localhost:8787/index.html`.
2. Confirm an unauthenticated request for `http://localhost:8787/panel.html` redirects to the login view.
3. Register a new client account; confirm the e-mail if Supabase requests it; log in and open the panel.
4. Register a trainer account and verify its displayed role is `trener`.
5. In SQL or the dashboard, verify each new `auth.users` row has one matching `public.profiles` row.
6. Log out and confirm `/panel.html` redirects again.

- [ ] **Step 5: Run final Supabase safety checks and commit**

Run the security advisor for `gbsvphzastgcsjvqiqwd` and resolve every finding related to the new schema.

Run: `git add README.md .gitignore test/server.test.js && git commit -m "docs: document Supabase authentication setup"`

## Plan self-review

- Spec coverage: Tasks 1–5 cover Supabase configuration, sign-up/login, profile roles, protected panel route, RLS, session restore/logout, error handling, tests and security review.
- Placeholder scan: no unfinished implementation markers remain; the migration timestamp is deliberately generated by the Supabase CLI before creation rather than guessed.
- Type consistency: `full_name`, `role`, `profile`, `accessToken`, `refreshToken` and the listed routes use the same names across all tasks.
