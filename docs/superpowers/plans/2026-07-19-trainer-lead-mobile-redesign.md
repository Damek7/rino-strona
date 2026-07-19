# Trainer Lead Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage and trainer subpage into a mobile-first, trainer-only lead funnel with memorable copy and a shorter qualification form.

**Architecture:** Keep the existing static HTML/CSS/JavaScript application and shared `trainer-signup.js` controller. Rewrite the public-page hierarchy in place, preserve the approved brand assets and existing homepage CTA positions, and reduce both form instances to the same three-step data contract. Update the Node waitlist handler and Google Sheets bridge together so browser validation and stored lead data remain consistent.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Node.js 22, `node:test`, Playwright, Google Apps Script

## Global Constraints

- Work only on branch `codex/trainer-lead-mobile-redesign`.
- The only conversion audience is trainers; do not add a client waitlist or client-search CTA.
- Do not add a sticky or fixed CTA at the bottom of the viewport.
- Preserve the existing homepage CTA positions and point them to the trainer form.
- Use `RinoMove. Tu trener jest marką.` as the homepage H1.
- Use `Twój profil pracuje. Ty trenujesz.` as the trainer-page H1.
- Do not promise a number of clients, income, guaranteed bookings, or market leadership.
- Treat 390 × 844 px as the primary viewport and support 320, 768, and 1440 px.
- Use graphite for text, raspberry for interactive accents, and blue-lavender for supporting surfaces.
- Use only existing RinoMove brand assets.
- Use visible focus states, 48 px primary controls, 16 px form text, and reduced-motion fallbacks.

---

### Task 1: Homepage trainer-only funnel and headline system

**Files:**
- Modify: `test/client-hero.test.js`
- Modify: `test/homepage-journey.test.js`
- Modify: `test/navigation-content.test.js`
- Modify: `test/account-entry.test.js`
- Modify: `index.html`
- Modify: `hero.css`
- Modify: `journey.css`
- Modify: `features.css`
- Modify: `cta.css`

**Interfaces:**
- Consumes: existing `#zapisy` form anchor and `data-trainer-signup` form contract.
- Produces: trainer-only homepage copy and existing-position CTA links targeting `#zapisy`.

- [ ] **Step 1: Replace client-first assertions with trainer-funnel assertions**

```js
test('homepage hero recruits trainer leads without unsupported promises', () => {
  assert.match(html, /<h1>RinoMove\. Tu trener jest marką\.<\/h1>/)
  assert.match(html, /Budujemy marketplace/)
  assert.match(html, /class="hero-cta"[\s\S]*?href="#zapisy"[^>]*>Zgłoś się jako trener-założyciel</)
  assert.doesNotMatch(html, /Znajdź trenera, z którym naprawdę zaczniesz/)
  assert.doesNotMatch(html, /gwarantujemy|gwarantowanych klientów|lider rynku/i)
})

test('homepage keeps existing CTA locations and adds no bottom CTA', () => {
  assert.match(html, /class="btn btn-primary nav-register" href="#zapisy">Zgłoś się</)
  assert.match(html, /class="btn nav-mobile-cta"[^>]*href="#zapisy">Zgłoś się</)
  assert.doesNotMatch(html, /bottom-cta|sticky-cta|mobile-cta-bar/)
})
```

- [ ] **Step 2: Run focused homepage tests and verify RED**

Run:

```powershell
node --test test/client-hero.test.js test/homepage-journey.test.js test/navigation-content.test.js test/account-entry.test.js
```

Expected: failures mention the old client H1, client-first section order, and `Zapisz się` CTA labels.

- [ ] **Step 3: Rewrite the homepage hierarchy and copy**

Use this structure and exact headings in `index.html`:

```html
<h1>RinoMove. Tu trener jest marką.</h1>
<p>Budujemy marketplace, w którym Twój profil, doświadczenie i wolne terminy prowadzą klienta prostą drogą do rezerwacji. Zaczynamy w Warszawie.</p>
<a class="btn btn-primary" href="#zapisy">Zgłoś się jako trener-założyciel</a>
<a class="btn-text" href="#jak-to-dziala">Zobacz, jak to działa <span class="arw" aria-hidden="true">→</span></a>
```

Replace the client-sport selector and client-benefit headings with:

```html
<h2>Klient szuka. Twój profil odpowiada.</h2>
<h2>Od pierwszego kliknięcia do potwierdzonego treningu.</h2>
<h2>Mniej ustalania. Więcej trenowania.</h2>
<h2>Pierwsi trenerzy ustalają zasady gry.</h2>
<h2>Sprawdźmy, czy RinoMove pasuje do Twojej pracy.</h2>
<h2>Konkrety przed zgłoszeniem.</h2>
```

Keep the existing navigation, hero, mid-page, and trainer-section CTA positions.
Remove sport-band links that present a client signup path. Do not append another
CTA after the final section.

- [ ] **Step 4: Tune homepage CSS for the shorter trainer message**

In `hero.css`, make the mobile H1 fit within three lines and keep the hero CTA
above the fold:

```css
@media (max-width: 620px) {
  #top.client-hero .hero {
    min-height: auto;
    padding: 96px 16px 44px;
  }

  #top.client-hero .hero h1 {
    max-width: 10ch;
    font-size: clamp(2.75rem, 12.4vw, 3.45rem);
    line-height: .94;
    letter-spacing: -.055em;
  }

  #top.client-hero .hero-cta .btn-primary {
    width: 100%;
    min-height: 52px;
  }
}
```

Retain focus styles and add no `position: fixed` or `position: sticky` bottom
CTA rules.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
node --test test/client-hero.test.js test/homepage-journey.test.js test/navigation-content.test.js test/account-entry.test.js
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit the homepage funnel**

```powershell
git add index.html hero.css journey.css features.css cta.css test/client-hero.test.js test/homepage-journey.test.js test/navigation-content.test.js test/account-entry.test.js
git commit -m "feat: focus homepage on trainer leads"
```

---

### Task 2: Trainer subpage conversion copy and mobile hierarchy

**Files:**
- Modify: `test/trainer-subpage.test.js`
- Modify: `test/public-subpage-navigation.test.js`
- Modify: `dla-trenerow.html`

**Interfaces:**
- Consumes: existing `#kontakt` anchor, shared `trainer-signup.js`, approved logo,
  wordmark, and tennis editorial image.
- Produces: detailed trainer landing page whose primary actions target `#kontakt`.

- [ ] **Step 1: Write trainer-page headline and CTA tests**

```js
test('trainer page leads with the trainer value proposition', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  assert.match(html, /<title>RinoMove dla trenerów\. Twój profil pracuje<\/title>/)
  assert.match(html, /<h1>Twój profil pracuje\. Ty trenujesz\.<\/h1>/)
  assert.match(html, /href="#kontakt"[^>]*>Zgłoś się jako trener-założyciel</)
  assert.doesNotMatch(html, />Przeglądaj trenerów</)
})

test('trainer page uses benefit-led section headings', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  for (const heading of [
    'Nie kolejny katalog. Miejsce zbudowane wokół trenera.',
    'Mniej wiadomości. Więcej jasnych ustaleń.',
    'Od zainteresowania do potwierdzonego terminu.',
    'Dołącz wcześniej. Pomóż ustawić dobry kierunek.',
    'Pokaż nam, jak pracujesz.',
    'Zanim dołączysz.'
  ]) assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})
```

- [ ] **Step 2: Run trainer-page tests and verify RED**

Run:

```powershell
node --test test/trainer-subpage.test.js test/public-subpage-navigation.test.js
```

Expected: failures mention the old H1 and `Przeglądaj trenerów`.

- [ ] **Step 3: Rewrite trainer-page headings, body copy, and actions**

Replace the hero with:

```html
<h1>Twój profil pracuje. Ty trenujesz.</h1>
<p>RinoMove ma pokazać klientowi Twoją ofertę, doświadczenie i wolne terminy, zanim napisze pierwszą wiadomość.</p>
<div class="hero-actions">
  <a class="btn" href="#kontakt">Zgłoś się jako trener-założyciel</a>
</div>
```

Use the exact section-heading map from the test. Preserve “budujemy” and
“planujemy” qualifiers in supporting paragraphs. Keep the existing founder
programme facts: first 30 trainers and three months free, without adding urgency
or invented scarcity.

- [ ] **Step 4: Simplify trainer-page motion and mobile hero CSS**

Remove `heroDrift` from the calendar, rating, and trainer cards. Keep the visual
static on touch devices and use only entry opacity/translation:

```css
.availability-card,
.rating-card,
.trainer-card {
  animation: none;
  transition: transform 180ms var(--ease);
}

@media (max-width: 620px) {
  .hero-shell {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 104px 20px 28px;
  }

  .hero h1 {
    max-width: 9ch;
    font-size: clamp(2.8rem, 13vw, 3.55rem);
  }

  .hero-actions,
  .hero-actions .btn {
    width: 100%;
  }
}
```

- [ ] **Step 5: Run trainer-page tests and verify GREEN**

Run:

```powershell
node --test test/trainer-subpage.test.js test/public-subpage-navigation.test.js
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit the trainer page**

```powershell
git add dla-trenerow.html test/trainer-subpage.test.js test/public-subpage-navigation.test.js
git commit -m "feat: sharpen trainer landing message"
```

---

### Task 3: Three-step trainer lead contract

**Files:**
- Modify: `test/trainer-signup-form.test.js`
- Modify: `test/trainer-signup-wizard.test.js`
- Modify: `test/waitlist-api.test.js`
- Modify: `test/google-sheets-script.test.js`
- Modify: `index.html`
- Modify: `dla-trenerow.html`
- Modify: `trainer-signup.js`
- Modify: `server.js`
- Modify: `integrations/google-sheets/Code.gs`
- Modify: `integrations/google-sheets/README.md`

**Interfaces:**
- Produces browser payload:

```js
{
  name: string,
  email: string,
  phone: string,
  profileUrl: string,
  discipline: string,
  city: string,
  district: string,
  workModel: 'independent' | 'club' | 'mixed',
  acceptingClients: 'yes' | 'soon' | 'no',
  primaryNeed: 'new_clients' | 'less_scheduling' | 'stronger_profile' | 'bookings_payments' | 'other',
  blocker: string,
  consent: boolean,
  website: string,
  source: 'homepage' | 'trainer_page'
}
```

- Produces server result `{ status: number, body: { ok?: true, error?: string } }`.
- Produces webhook payload with normalized strings and
  `qualificationStatus: 'qualified' | 'review' | 'waitlist'`.

- [ ] **Step 1: Replace seven-step contract tests with three-step tests**

```js
test(`${page} exposes the three-step trainer lead contract`, () => {
  const form = signupForm(html)
  assert.match(form, new RegExp(`data-source="${source}"`))
  assert.equal((form.match(/data-signup-step=/g) || []).length, 3)
  for (const name of [
    'discipline', 'city', 'district', 'workModel', 'acceptingClients',
    'primaryNeed', 'blocker', 'name', 'email', 'phone', 'profileUrl',
    'consent', 'website'
  ]) assert.match(form, new RegExp(`name="${name}"`))
})
```

Update the Playwright test to complete three steps and assert that a failed
delivery preserves `discipline` and `email`.

- [ ] **Step 2: Rewrite API tests for the reduced lead**

Use this `validLead`:

```js
const validLead = {
  name: '  Anna Nowak  ',
  email: ' ANNA@EXAMPLE.COM ',
  phone: ' 600 100 200 ',
  profileUrl: ' https://instagram.com/anna.trenuje ',
  discipline: ' Tenis ',
  city: ' Warszawa ',
  district: ' Mokotów ',
  workModel: 'independent',
  acceptingClients: 'yes',
  primaryNeed: 'new_clients',
  blocker: ' Tracę dużo czasu na ręczne ustalanie terminów z klientami. ',
  source: 'homepage',
  consent: true,
  website: ''
}
```

Assert that blank optional phone, profile URL, district, and blocker are
accepted, while invalid provided values are rejected.

- [ ] **Step 3: Run form, API, and integration tests and verify RED**

Run:

```powershell
node --test test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js test/waitlist-api.test.js test/google-sheets-script.test.js
```

Expected: failures mention seven steps and missing `acceptingClients` or
`primaryNeed`.

- [ ] **Step 4: Replace both form instances with the same three-step markup**

The step structure is:

```html
<fieldset data-signup-step="1">
  <legend>Gdzie i jak trenujesz?</legend>
  <!-- discipline, city, optional district, workModel -->
</fieldset>
<fieldset data-signup-step="2" hidden>
  <legend>Czego potrzebujesz najbardziej?</legend>
  <!-- acceptingClients, primaryNeed, optional blocker -->
</fieldset>
<fieldset data-signup-step="3" data-signup-contact hidden>
  <legend>Jak możemy się z Tobą skontaktować?</legend>
  <!-- name, email, optional phone/profileUrl, consent, honeypot, submit -->
</fieldset>
```

Use `autocomplete="name"`, `autocomplete="email"`, `autocomplete="tel"`,
`inputmode="email"`, and `type="url"` where appropriate. Keep all visible input
text at 16 px or larger.

- [ ] **Step 5: Simplify the shared wizard controller**

Set progress from `state.steps.length`, remove `data-other-result` and readiness
special handling, and send the new payload:

```js
body: JSON.stringify({
  name: data.get('name'),
  email: data.get('email'),
  phone: data.get('phone'),
  profileUrl: data.get('profileUrl'),
  discipline: data.get('discipline'),
  city: data.get('city'),
  district: data.get('district'),
  workModel: data.get('workModel'),
  acceptingClients: data.get('acceptingClients'),
  primaryNeed: data.get('primaryNeed'),
  blocker: data.get('blocker'),
  consent: data.get('consent') === 'on',
  website: data.get('website'),
  source: form.dataset.source
})
```

Use the approved success and failure messages from the design spec.

- [ ] **Step 6: Update waitlist normalization and qualification**

Replace the old enums with:

```js
const acceptingClientOptions = new Set(['yes', 'soon', 'no'])
const primaryNeeds = new Set([
  'new_clients',
  'less_scheduling',
  'stronger_profile',
  'bookings_payments',
  'other'
])

function qualificationStatus({ city, acceptingClients }) {
  if (String(city || '').trim().toLocaleLowerCase('pl') !== 'warszawa') return 'waitlist'
  return acceptingClients === 'yes' ? 'qualified' : 'review'
}
```

Phone, profile URL, district, and blocker validate only when non-empty. Keep name,
email, discipline, city, work model, accepting-clients state, primary need,
source, and consent required.

- [ ] **Step 7: Update the Google Sheets row contract**

Use this row order:

```js
[
  new Date(),
  input.name,
  input.email,
  input.phone,
  input.profileUrl,
  input.discipline,
  input.city,
  input.district,
  input.workModel,
  input.acceptingClients,
  input.primaryNeed,
  input.blocker,
  input.qualificationStatus,
  input.source,
  'Nowy',
  '',
  ''
]
```

Document the exact matching header order in
`integrations/google-sheets/README.md`.

- [ ] **Step 8: Run form, API, and integration tests and verify GREEN**

Run:

```powershell
node --test test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js test/waitlist-api.test.js test/google-sheets-script.test.js
```

Expected: all selected tests pass.

- [ ] **Step 9: Commit the lead contract**

```powershell
git add index.html dla-trenerow.html trainer-signup.js server.js integrations/google-sheets/Code.gs integrations/google-sheets/README.md test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js test/waitlist-api.test.js test/google-sheets-script.test.js
git commit -m "feat: shorten trainer lead form"
```

---

### Task 4: Mobile visual QA and full verification

**Files:**
- Modify if needed: `navigation.css`
- Modify if needed: `hero.css`
- Modify if needed: `cta.css`
- Modify if needed: `dla-trenerow.html`
- Modify if needed: focused tests covering any discovered regression

**Interfaces:**
- Consumes: completed homepage, trainer page, and three-step form.
- Produces: verified pages at 320, 390, 768, and 1440 px with no horizontal
  overflow and all primary CTAs ending at a trainer form.

- [ ] **Step 1: Run static copy and accessibility checks**

Run:

```powershell
rg -n "Znajdź trenera|Przeglądaj trenerów|gwarantujemy|lider rynku|sticky-cta|bottom-cta" index.html dla-trenerow.html
rg -n "<h1|<h2|<h3|href=\"#zapisy\"|href=\"#kontakt\"" index.html dla-trenerow.html
```

Expected: no old client conversion copy or bottom CTA classes; one H1 per page;
all primary CTA anchors target `#zapisy` or `#kontakt`.

- [ ] **Step 2: Run the full automated suite**

Run:

```powershell
npm test
```

Expected: exit code 0 and no failed tests. If the full suite exceeds two minutes,
run each `test/*.test.js` file separately, record the exact hanging file, and fix
the leaked browser/server handle before continuing.

- [ ] **Step 3: Start the application server**

Run:

```powershell
$env:PORT = '8787'
npm start
```

Expected: `RinoMove działa: http://localhost:8787`.

- [ ] **Step 4: Verify phone and desktop layouts in Chromium**

For each page (`/index.html`, `/dla-trenerow.html`) and viewport
`320×800`, `390×844`, `768×1024`, and `1440×1000`:

```js
await page.setViewportSize({ width, height })
await page.goto(url)
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth
)
```

Expected: `overflow === false`. At 390 px, hero H1, body, and primary CTA are
readable before the decorative visual dominates the screen.

- [ ] **Step 5: Exercise both three-step forms**

Complete the happy path until submission, navigate backward once, and verify
values persist. With no webhook configuration, submission must show an inline
retryable error without clearing answers.

- [ ] **Step 6: Check keyboard, focus, and reduced motion**

Tab through navigation and both forms; every interactive control must have a
visible focus state. Emulate reduced motion and confirm there is no translated
or looping animation.

- [ ] **Step 7: Capture final screenshots**

Capture mobile and desktop screenshots of both pages under
`.playwright-cli/`. Do not commit these ignored audit artifacts.

- [ ] **Step 8: Commit any QA fixes**

```powershell
git add navigation.css hero.css cta.css dla-trenerow.html index.html test
git commit -m "fix: polish trainer funnel across viewports"
```

- [ ] **Step 9: Leave the preview server running**

Confirm:

```powershell
Invoke-WebRequest http://127.0.0.1:8787/api/health | Select-Object -ExpandProperty Content
```

Expected: JSON with `"ok":true`. Report `http://localhost:8787/` to the user.

