# Account, Trainer Photo and Client Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uprościć logowanie i nawigację klienta oraz wymagać trwałego zdjęcia podczas rejestracji trenera.

**Architecture:** Zachować istniejący formularz i kontrakt store, dodając mały helper walidujący obraz oraz `avatarDataUrl` do rejestracji. Tryb demo przechowuje zdjęcie w profilu lokalnym, a Supabase przesyła je do publicznego bucketa użytkownika i zapisuje URL w `profiles.avatar_url`.

**Tech Stack:** HTML, CSS, JavaScript, Node.js 22 test runner, Supabase Auth/Postgres/Storage.

## Global Constraints

- Logowanie pokazuje tylko e-mail i hasło na białym tle.
- Zdjęcie jest wymagane tylko dla nowych kont trenera; JPEG, PNG lub WebP, maksymalnie 5 MB.
- Konta demo i kalendarz trenera pozostają bez zmian.
- Kalendarz klienta nie występuje w głównej nawigacji, ale może działać jako wewnętrzny krok wyboru terminu.

---

### Task 1: Logowanie i nawigacja klienta

**Files:**
- Modify: `test/client-flows.test.js`
- Modify: `test/panel-shell.test.js`
- Modify: `lib/panel-helpers.js`
- Modify: `panel.js`
- Modify: `panel.css`

**Interfaces:**
- Consumes: `navigationForRole(role)` i istniejący `setAuthMode(mode)`.
- Produces: nawigację klienta `discover, bookings, messages, settings` oraz wewnętrzne dopuszczenie trasy `calendar` tylko podczas wyboru trenera.

- [ ] **Step 1: Write the failing tests**

```js
assert.deepEqual(navigationForRole('client').map(item => item.route), ['discover', 'bookings', 'messages', 'settings'])
assert.match(js, /authMode:\s*'login'/)
assert.match(css, /dialog#authDialog::backdrop[^{]*\{[^}]*background:\s*#fff/s)
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test test/client-flows.test.js test/panel-shell.test.js`
Expected: FAIL because client navigation still contains `calendar`, initial mode is `register`, and the auth backdrop is not white.

- [ ] **Step 3: Implement the minimum behavior**

```js
const clientNavigation = [
  ['discover', 'Trenerzy', 'search'],
  ['bookings', 'Rezerwacje', 'booking'],
  ['messages', 'Wiadomości', 'message'],
  ['settings', 'Ustawienia', 'settings'],
]
```

Set `authMode: 'login'`, call `setAuthMode('login')` when the account button opens, keep `calendar` in a separate internal route allow-list only when `state.selectedTrainer` exists, and add:

```css
dialog#authDialog::backdrop { background: #fff; backdrop-filter: none; }
```

- [ ] **Step 4: Run focused tests**

Run: `node --test test/client-flows.test.js test/panel-shell.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add test/client-flows.test.js test/panel-shell.test.js lib/panel-helpers.js panel.js panel.css
git commit -m "feat: simplify client account entry"
```

### Task 2: Obowiązkowe zdjęcie trenera w formularzu i demo

**Files:**
- Modify: `test/trainer-flows.test.js`
- Modify: `test/demo-store.test.js`
- Modify: `panel.html`
- Modify: `panel.css`
- Modify: `panel.js`
- Modify: `lib/panel-helpers.js`
- Modify: `lib/demo-store.js`

**Interfaces:**
- Produces: `validateTrainerPhoto(file)` zwracające zaakceptowany plik lub rzucające czytelny błąd; `signUp(input)` przyjmuje `avatarDataUrl` dla roli `trainer`.
- Consumes: istniejący formularz `#authForm` oraz `trainerProfiles` w demo store.

- [ ] **Step 1: Write failing tests**

```js
assert.throws(() => validateTrainerPhoto(null), /zdjęcie/)
assert.throws(() => validateTrainerPhoto({ type: 'image/gif', size: 100 }), /JPEG, PNG lub WebP/)
assert.doesNotThrow(() => validateTrainerPhoto({ type: 'image/webp', size: 1024 }))
await assert.rejects(() => store.signUp({ fullName: 'Jan', email: 'jan@example.pl', password: 'Haslo12345', role: 'trainer', acceptTerms: true }), /zdjęcie/)
```

Also register with `avatarDataUrl: 'data:image/webp;base64,AA=='`, recreate the store, and assert `getTrainerProfile().avatarUrl` retains the value.

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test test/trainer-flows.test.js test/demo-store.test.js`
Expected: FAIL because the helper and trainer-photo requirement do not exist.

- [ ] **Step 3: Implement photo field and validation**

Add a hidden trainer-only field:

```html
<label id="trainerPhotoField" hidden>Zdjęcie profilowe
  <input name="trainerPhoto" type="file" accept="image/jpeg,image/png,image/webp">
  <span id="trainerPhotoPreview" class="photo-preview"></span>
</label>
```

Implement:

```js
function validateTrainerPhoto(file) {
  if (!file) throw new Error('Dodaj zdjęcie profilowe trenera.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Zdjęcie musi być w formacie JPEG, PNG lub WebP.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Zdjęcie może mieć maksymalnie 5 MB.')
  return file
}
```

Use `FileReader.readAsDataURL`, show the preview, pass `avatarDataUrl` only for trainer registration, and render the image in account/profile avatars when available. In demo `signUp`, require `avatarDataUrl` for trainers and save it as `avatarUrl` on the user/profile.

- [ ] **Step 4: Run focused tests**

Run: `node --test test/trainer-flows.test.js test/demo-store.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add test/trainer-flows.test.js test/demo-store.test.js panel.html panel.css panel.js lib/panel-helpers.js lib/demo-store.js
git commit -m "feat: require trainer profile photo"
```

### Task 3: Supabase Storage contract

**Files:**
- Modify: `test/supabase-store-contract.test.js`
- Modify: `test/supabase-schema.test.js`
- Modify: `lib/supabase-store.js`
- Modify: `supabase/migrations/20260715015641_product_mvp.sql`

**Interfaces:**
- Consumes: `input.avatarDataUrl` from Task 2.
- Produces: public bucket `trainer-avatars`; object path `${user.id}/profile.<ext>`; `profiles.avatar_url` updated after upload.

- [ ] **Step 1: Write failing tests**

```js
assert.match(sql, /insert into storage\.buckets[\s\S]+trainer-avatars/i)
assert.match(sql, /storage\.foldername\(name\)\[1\][\s\S]+auth\.uid\(\)::text/i)
assert.match(source, /client\.storage\.from\('trainer-avatars'\)\.upload/)
```

Extend the registration contract test to require `avatarDataUrl` for a trainer before calling Supabase Auth.

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test test/supabase-store-contract.test.js test/supabase-schema.test.js`
Expected: FAIL because Storage setup and upload are absent.

- [ ] **Step 3: Implement Storage upload and policies**

Convert the data URL to a `Blob`, sign up, upload only when a session exists, get the public URL, then update the current profile. Store pending photo data in `sessionStorage` when e-mail confirmation delays authentication and finish the upload after the first successful sign-in.

Add idempotent bucket creation and policies restricting insert/update/delete to paths beginning with `auth.uid()`, while allowing public select for `bucket_id = 'trainer-avatars'`.

- [ ] **Step 4: Run focused tests**

Run: `node --test test/supabase-store-contract.test.js test/supabase-schema.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add test/supabase-store-contract.test.js test/supabase-schema.test.js lib/supabase-store.js supabase/migrations/20260715015641_product_mvp.sql
git commit -m "feat: persist trainer photos with Supabase Storage"
```

### Task 4: Full verification and live handoff

**Files:**
- Modify only if a failing regression requires an in-scope correction.

**Interfaces:**
- Consumes: completed UI and both store implementations.
- Produces: verified live localhost page.

- [ ] **Step 1: Run all automated checks**

Run: `npm test`
Expected: all tests PASS.

Run: `node --check panel.js; node --check lib/panel-helpers.js; node --check lib/demo-store.js; node --check lib/supabase-store.js; git diff --check`
Expected: exit code 0.

- [ ] **Step 2: Verify in the browser**

Reload `http://localhost:8787/panel.html` and confirm: login opens first on an opaque white backdrop; name is absent in login; trainer registration requires and previews an image; demo buttons remain; client navigation has no calendar; trainer navigation still has calendar.

- [ ] **Step 3: Commit any verified final correction**

```powershell
git add panel.html panel.css panel.js lib/panel-helpers.js lib/demo-store.js lib/supabase-store.js test/client-flows.test.js test/panel-shell.test.js test/trainer-flows.test.js test/demo-store.test.js test/supabase-store-contract.test.js test/supabase-schema.test.js supabase/migrations/20260715015641_product_mvp.sql
git commit -m "fix: polish account registration flow"
```

- [ ] **Step 4: Confirm clean branch**

Run: `git status --short --branch`
Expected: branch header only, with no modified or untracked files.
