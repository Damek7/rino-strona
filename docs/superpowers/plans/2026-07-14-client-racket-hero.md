# Client Racket Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the trainer-focused homepage hero with the approved client-focused two-column hero and the generated three-racket 3D artwork.

**Architecture:** Keep the existing DC page runtime and navigation unchanged. Replace only the `#top` hero markup, load one focused `hero.css` override after `navigation.css`, and add one static image asset plus a Node content-contract test.

**Tech Stack:** Static HTML/CSS, existing DC runtime, PNG image asset, Node.js built-in test runner.

## Global Constraints

- Homepage hero is exclusively for clients; no trainer-founder or trainer-administration copy.
- Exact heading: `Znajdź trenera, z którym naprawdę zaczniesz.`
- Primary CTA: `Znajdź trenera` → `#trenerzy`.
- Secondary CTA: `Zobacz, jak to działa` → `#jak-to-dziala`.
- Exactly two decorative dots: pink left and blue right, both `aria-hidden="true"`.
- Use `assets/hero-rackets-3d-v1.png` for the approved three-racket render.
- Do not modify navigation, following sections, auth, database, or trainer subpage content.
- Preserve `prefers-reduced-motion` and a minimum 44 px CTA height.

---

### Task 1: Client hero contract and implementation

**Files:**
- Create: `test/client-hero.test.js`
- Create: `hero.css`
- Create: `assets/hero-rackets-3d-v1.png`
- Modify: `index.html` at the stylesheet links and `#top` hero block

**Interfaces:**
- Consumes: existing anchors `#trenerzy`, `#jak-to-dziala`, existing `.btn` styles, and the approved generated PNG.
- Produces: semantic `.client-hero`, `.hero-art`, `.hero-proof`, `.hero-dot--pink`, and `.hero-dot--blue` elements.

- [ ] **Step 1: Write the failing contract test**

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

test('homepage hero speaks only to clients', () => {
  assert.match(html, /Znajdź trenera, z którym naprawdę zaczniesz\./)
  assert.match(html, /href="#trenerzy"[^>]*>Znajdź trenera</)
  assert.match(html, /href="#jak-to-dziala"[^>]*>Zobacz, jak to działa</)
  assert.doesNotMatch(html, /Rekrutujemy trenerów-założycieli/)
  assert.doesNotMatch(html, /Dołącz jako trener/)
})

test('hero uses the approved racket art and two decorative dots', () => {
  assert.match(html, /href="hero\.css"/)
  assert.match(html, /assets\/hero-rackets-3d-v1\.png/)
  assert.equal((html.match(/class="hero-dot hero-dot--/g) || []).length, 2)
  assert.match(html, /hero-dot--pink" aria-hidden="true"/)
  assert.match(html, /hero-dot--blue" aria-hidden="true"/)
})

test('hero styles preserve brand colors and mobile behavior', () => {
  const css = fs.readFileSync(path.join(root, 'hero.css'), 'utf8')
  assert.match(css, /#C72562/i)
  assert.match(css, /#A9D4EA/i)
  assert.match(css, /@media\s*\(max-width:\s*920px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/client-hero.test.js`

Expected: FAIL because the approved copy, `hero.css`, racket asset, and dot markup do not exist.

- [ ] **Step 3: Add the approved artwork**

Copy the accepted generated file to `assets/hero-rackets-3d-v1.png` without modifying any existing asset.

- [ ] **Step 4: Replace only the hero markup**

Use this structure inside `#top`:

```html
<span class="hero-dot hero-dot--pink" aria-hidden="true"></span>
<span class="hero-dot hero-dot--blue" aria-hidden="true"></span>
<div class="wrap hero">
  <div class="hero-copy">
    <span class="hero-eyebrow">Ruch zaczyna się od właściwej osoby</span>
    <h1>Znajdź trenera, z którym naprawdę zaczniesz.</h1>
    <p class="hero-lead">Wybierz sport, porównaj zweryfikowane profile i zarezerwuj pierwszy trening — bez telefonów i szukania po całym internecie.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="#trenerzy">Znajdź trenera</a>
      <a class="btn-text" href="#jak-to-dziala">Zobacz, jak to działa <span class="arw">→</span></a>
    </div>
    <div class="hero-proof" aria-label="Korzyści dla klienta"><span>Zweryfikowane profile</span><span>Jasna cena</span><span>Rezerwacja online</span></div>
  </div>
  <div class="hero-media">
    <figure class="hero-art">
      <img src="assets/hero-rackets-3d-v1.png" alt="Trzy rakiety 3D: squashowa, tenisowa i padlowa" width="1024" height="1536" fetchpriority="high">
    </figure>
  </div>
</div>
```

- [ ] **Step 5: Add focused responsive styles**

Create `hero.css` scoped to `#top.client-hero`. Use two desktop columns, one mobile column, image cropping with `object-fit: cover`, layered soft shadows, explicit transition properties, the two brand-colored edge dots, 44 px minimum CTA size, and a reduced-motion override.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test`

Expected: all project tests pass with zero failures.

---

### Task 2: Browser verification

**Files:**
- Verify: `index.html`
- Verify: `hero.css`
- Verify: `assets/hero-rackets-3d-v1.png`

**Interfaces:**
- Consumes: local server at `http://127.0.0.1:8787/`.
- Produces: verified desktop and mobile hero ready for user review.

- [ ] **Step 1: Start or reuse the local server**

Run: `npm start`

Expected: the page is available at `http://127.0.0.1:8787/`.

- [ ] **Step 2: Verify desktop**

At 1440 × 1000 confirm: navigation remains centered; copy is left; rackets are right; both edge dots are visible but subdued; no trainer CTA remains; no horizontal overflow.

- [ ] **Step 3: Verify mobile**

At 390 × 844 confirm: copy appears before artwork; CTAs remain usable; the rackets fit without clipping important parts; dots stay subdued; no horizontal overflow.

- [ ] **Step 4: Run final checks**

Run: `npm test`

Run: `git diff --check`

Expected: tests report zero failures and whitespace check exits `0`.

## Plan self-review

- Spec coverage: Task 1 covers approved content, artwork, dots, scope, accessibility, and responsive CSS; Task 2 covers both required viewports and overflow.
- Placeholder scan: no unfinished implementation markers remain.
- Naming consistency: `client-hero`, `hero-art`, `hero-dot--pink`, `hero-dot--blue`, and `hero-rackets-3d-v1.png` are identical across markup, CSS, tests, and verification steps.
