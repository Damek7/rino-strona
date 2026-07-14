# RinoMove Guided Homepage Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the RinoMove homepage into a client-first guided journey with a distinctive three-step process, consolidated trust proof, and content that never disappears when reveal animation does not run.

**Architecture:** Keep the existing static HTML/DCLogic structure and focused CSS files. Add `journey.css` for the new process and trust sections, preserve `features.css` for the existing product showcase, and change reveal behavior from content-hiding to non-blocking progressive enhancement.

**Tech Stack:** HTML, CSS, existing DCLogic runtime, vanilla JavaScript, Node.js built-in test runner, Playwright CLI.

## Global Constraints

- Main audience is a client looking for a trainer; trainers use the secondary route `dla-trenerow.html`.
- Keep existing hero, navigation, sports assets, form behavior, panel, backend, and authentication intact.
- Do not add dependencies.
- Content must remain visible without JavaScript and before any scroll-triggered animation.
- Support `1440 × 1000`, `390 × 844`, and widths down to `320px` without horizontal overflow.
- Respect `prefers-reduced-motion: reduce`; never use `transition: all`.
- Preserve unrelated dirty-worktree changes in `navigation.css`, `package.json`, and `test/navigation-content.test.js`.

---

### Task 1: Define the homepage journey contract

**Files:**
- Create: `test/homepage-journey.test.js`
- Modify: `test/feature-cards.test.js`
- Test: `test/homepage-journey.test.js`

**Interfaces:**
- Consumes: static `index.html`, `journey.css`, `features.css`, and `sports.css` files.
- Produces: a contract for section order, approved copy, destinations, three process previews, trust proof, and non-blocking reveal behavior.

- [ ] **Step 1: Write the failing journey tests**

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const journeyCss = path.join(root, 'journey.css')

test('homepage follows the approved client-first section order', () => {
  const ids = ['specjalizacje', 'jak-to-dziala', 'zaufanie', 'korzysci', 'dla-trenerow', 'zapisy', 'faq']
  let cursor = -1
  for (const id of ids) {
    const next = html.indexOf(`id="${id}"`, cursor + 1)
    assert.ok(next > cursor, `${id} should follow the approved journey order`)
    cursor = next
  }
})

test('how it works contains three product-backed steps', () => {
  assert.equal((html.match(/class="journey-step journey-step--/g) || []).length, 3)
  assert.equal((html.match(/class="journey-preview journey-preview--/g) || []).length, 3)
  assert.match(html, /Porównaj właściwe osoby/)
  assert.match(html, /Wybierz wolny termin/)
  assert.match(html, /Zapłać i przyjdź na trening/)
})

test('trust proof uses verified platform facts and a client CTA', () => {
  assert.match(html, /id="zaufanie"/)
  assert.match(html, /Profil zweryfikowany/)
  assert.match(html, /Cena widoczna przed rezerwacją/)
  assert.match(html, /Opinia po odbytym treningu/)
  assert.match(html, /href="panel\.html"[^>]*>Zobacz trenerów</)
})

test('journey stylesheet is responsive and motion safe', () => {
  assert.match(html, /href="journey\.css"/)
  assert.equal(fs.existsSync(journeyCss), true)
  const css = fs.readFileSync(journeyCss, 'utf8')
  assert.match(css, /@media\s*\(max-width:\s*720px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.doesNotMatch(css, /transition:\s*all\b/)
})
```

- [ ] **Step 2: Update the existing feature-order assertion**

```js
test('client benefits sit after trust proof and before the trainer route', () => {
  const trust = html.indexOf('id="zaufanie"')
  const benefits = html.indexOf('id="korzysci"')
  const trainers = html.indexOf('id="dla-trenerow"')
  assert.ok(trust < benefits && benefits < trainers)
  assert.match(html, /href="features\.css"/)
})
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run: `node --test test/homepage-journey.test.js test/feature-cards.test.js`

Expected: FAIL because `journey.css`, `#zaufanie`, `.journey-step`, and the new order do not exist.

- [ ] **Step 4: Commit the test contract**

```bash
git add test/homepage-journey.test.js test/feature-cards.test.js
git commit -m "test: define guided homepage journey"
```

---

### Task 2: Build the three-step journey and trust proof

**Files:**
- Create: `journey.css`
- Modify: `index.html`
- Test: `test/homepage-journey.test.js`

**Interfaces:**
- Consumes: global CSS tokens from `index.html`, existing `.wrap`, `.btn`, and `panel.html` route.
- Produces: `#jak-to-dziala`, `.journey-step--profile`, `.journey-step--calendar`, `.journey-step--payment`, and `#zaufanie`.

- [ ] **Step 1: Load the dedicated stylesheet after sports and before features**

```html
<link rel="stylesheet" href="sports.css">
<link rel="stylesheet" href="journey.css">
<link rel="stylesheet" href="features.css">
```

- [ ] **Step 2: Insert the approved process after `#specjalizacje`**

```html
<section id="jak-to-dziala" class="journey" data-screen-label="Jak to działa">
  <div class="wrap">
    <div class="journey-head">
      <div><span class="journey-eyebrow">Od wyboru do treningu</span><h2>Trzy kroki. Jedna spokojna decyzja.</h2></div>
      <p>Bez telefonów, przeklejania linków i niejasnych cen.</p>
    </div>
    <div class="journey-track">
      <article class="journey-step journey-step--profile">
        <span class="journey-number">01</span><h3>Porównaj właściwe osoby</h3>
        <p>Sport, dzielnica, doświadczenie, certyfikaty i opinie masz w jednym widoku.</p>
        <div class="journey-preview journey-preview--profile" aria-hidden="true">
          <div class="mini-profile-head"><span class="mini-avatar">AK</span><span><b>Anna Kowalska</b><small>Tenis · Mokotów</small></span><i>Zweryfikowana</i></div>
          <div class="mini-tags"><span>Dorośli</span><span>Początkujący</span></div>
          <div class="mini-rating"><b>4,9 ★</b><span>38 opinii</span></div>
        </div>
      </article>
      <article class="journey-step journey-step--calendar">
        <span class="journey-number">02</span><h3>Wybierz wolny termin</h3>
        <p>Aktualny kalendarz pokazuje dostępne godziny bez wymiany wiadomości.</p>
        <div class="journey-preview journey-preview--calendar" aria-hidden="true">
          <div class="mini-calendar-head"><b>Najbliższe terminy</b><span>Lipiec</span></div>
          <div class="mini-calendar-days"><span>Śr<small>16</small></span><span class="is-selected">Czw<small>17</small></span><span>Pt<small>18</small></span></div>
          <div class="mini-slots"><span>17:00</span><span class="is-selected">18:30</span><span>20:00</span></div>
        </div>
      </article>
      <article class="journey-step journey-step--payment">
        <span class="journey-number">03</span><h3>Zapłać i przyjdź na trening</h3>
        <p>Jasna cena, płatność online i potwierdzenie trafiają w jedno miejsce.</p>
        <div class="journey-preview journey-preview--payment" aria-hidden="true">
          <span class="mini-status">✓ Rezerwacja potwierdzona</span>
          <div class="mini-payment-row"><span>Tenis · 60 min</span><b>220 zł</b></div>
          <div class="mini-payment-row"><span>Czwartek, 18:30</span><small>Opłacono online</small></div>
        </div>
      </article>
    </div>
  </div>
</section>
```

Each article contains a visible number, heading, description, and one `aria-hidden="true"` `.journey-preview` matching the profile, calendar, or payment step.

- [ ] **Step 3: Insert the trust proof before `#korzysci`**

```html
<section id="zaufanie" class="trust-proof" data-screen-label="Dlaczego RinoMove">
  <div class="wrap trust-proof-shell">
    <div class="trust-proof-copy">
      <span class="trust-proof-eyebrow">Pewny pierwszy krok</span>
      <h2>Nie musisz znać się na sporcie, żeby dobrze wybrać.</h2>
      <p>RinoMove porządkuje informacje, które zwykle są rozrzucone po profilach, wiadomościach i stronach klubów.</p>
      <a class="btn btn-primary" href="panel.html">Zobacz trenerów</a>
    </div>
    <div class="trust-proof-list">
      <div><span>01</span><strong>Profil zweryfikowany</strong><p>Certyfikaty i doświadczenie w jednym miejscu.</p></div>
      <div><span>02</span><strong>Cena widoczna przed rezerwacją</strong><p>Wiesz, ile zapłacisz, zanim wybierzesz termin.</p></div>
      <div><span>03</span><strong>Opinia po odbytym treningu</strong><p>Recenzję może dodać klient po zakończonej rezerwacji.</p></div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Remove the old generic `.steps` section**

Delete the previous `#jak-to-dziala` block that rendered `{{ steps }}` and remove the unused `steps` array from `renderVals()`.

- [ ] **Step 5: Add focused responsive styling**

Implement `journey.css` with:

```css
.journey-track { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.journey-step { min-width: 0; border-radius: 28px; box-shadow: var(--shadow-card); }
.journey-preview { border-radius: 20px; outline: 1px solid rgba(28, 27, 32, .08); outline-offset: -1px; }
@media (max-width: 720px) { .journey-track { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .journey * { transition-duration: .01ms !important; } }
```

Use concentric radii, explicit transition properties, balanced headings, pretty body copy, tabular step numbers, and minimum `44px` CTA height.

- [ ] **Step 6: Run the focused tests and confirm GREEN**

Run: `node --test test/homepage-journey.test.js test/feature-cards.test.js`

Expected: all focused tests PASS.

- [ ] **Step 7: Commit the journey implementation**

```bash
git add index.html journey.css test/homepage-journey.test.js test/feature-cards.test.js
git commit -m "feat: guide clients through homepage journey"
```

---

### Task 3: Make reveal motion non-blocking

**Files:**
- Modify: `sports.css`
- Modify: `features.css`
- Modify: `index.html`
- Modify: `test/homepage-journey.test.js`
- Test: `test/sport-bands.test.js`
- Test: `test/feature-cards.test.js`

**Interfaces:**
- Consumes: existing `.reveal`, `.sport-band`, `.is-visible`, and `IntersectionObserver` hooks.
- Produces: visible-by-default content with optional `.motion-ready` enhancement and reduced-motion fallback.

- [ ] **Step 1: Add a failing progressive-enhancement assertion**

```js
test('reveal motion never makes homepage content depend on JavaScript', () => {
  const sports = fs.readFileSync(path.join(root, 'sports.css'), 'utf8')
  const features = fs.readFileSync(path.join(root, 'features.css'), 'utf8')
  assert.doesNotMatch(sports, /\.has-js\s+\.sport-band:not\(\.is-visible\)[\s\S]*?opacity:\s*0/)
  assert.doesNotMatch(features, /\.has-js\s+\.feature-card\.reveal:not\(\.is-visible\)[\s\S]*?opacity:\s*0/)
  assert.match(html, /classList\.add\('motion-ready'\)/)
})
```

- [ ] **Step 2: Run the assertion and confirm RED**

Run: `node --test test/homepage-journey.test.js`

Expected: FAIL because both stylesheets currently hide content under `.has-js` and the script adds only `has-js`.

- [ ] **Step 3: Replace content-hiding selectors**

Change reveal selectors to `.motion-ready` and keep content readable before intersection. Initial motion may use `translateY`, `filter: blur(4px)`, and `opacity: .92`, but never `opacity: 0`. Reduced motion must restore `opacity: 1`, `filter: none`, and `transform: none`.

- [ ] **Step 4: Activate motion only after capability checks**

```js
document.documentElement.classList.add('has-js')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reduceMotion || !('IntersectionObserver' in window)) return
document.documentElement.classList.add('motion-ready')
```

On `pagehide`, remove `motion-ready` after disconnecting observers. Do not change form or FAQ behavior.

- [ ] **Step 5: Run the motion and existing component tests**

Run: `node --test test/homepage-journey.test.js test/sport-bands.test.js test/feature-cards.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the progressive enhancement fix**

```bash
git add index.html sports.css features.css test/homepage-journey.test.js test/sport-bands.test.js test/feature-cards.test.js
git commit -m "fix: keep homepage content visible before reveal"
```

---

### Task 4: Verify the complete homepage

**Files:**
- Verify: `index.html`
- Verify: `journey.css`
- Verify: `sports.css`
- Verify: `features.css`
- Create artifacts: `output/playwright/homepage-guided-desktop.png`, `output/playwright/homepage-guided-mobile.png`

**Interfaces:**
- Consumes: the completed static homepage served by `node server.js`.
- Produces: automated and visual evidence for the full goal.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests PASS with no failures.

- [ ] **Step 2: Check source hygiene**

Run: `git diff --check` and `rg -n "transition:\s*all\b" journey.css sports.css features.css`

Expected: no whitespace errors and no `transition: all` matches.

- [ ] **Step 3: Capture current desktop and mobile views**

Use Playwright CLI to open `http://localhost:8787/`, snapshot it, resize to `1440 1000`, scroll through the page, and save a full-page screenshot to `output/playwright/homepage-guided-desktop.png`. Repeat with mobile emulation and save `output/playwright/homepage-guided-mobile.png`.

- [ ] **Step 4: Inspect layout and runtime behavior**

Verify in both screenshots and the live page:

- the section order matches the contract;
- all six sport bands show text and Rino artwork;
- all three journey previews are visible;
- the trust module is legible and not clipped;
- there are no animation-created blank regions;
- trainer CTA opens `dla-trenerow.html`;
- main client CTA opens `panel.html`;
- mobile has no horizontal overflow and interactive targets remain usable.

- [ ] **Step 5: Review only task-owned diffs**

Run: `git status --short` and `git diff HEAD~3 -- index.html journey.css sports.css features.css test/homepage-journey.test.js test/feature-cards.test.js test/sport-bands.test.js`.

Expected: every changed line traces to the approved homepage goal; unrelated pre-existing changes remain untouched.
