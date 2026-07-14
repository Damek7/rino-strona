# Client Liquid Glass Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved compact, centered liquid-glass navigation to the client homepage, connect login/register deep links, and expose the existing trainer landing as a local subpage.

**Architecture:** Keep the current single-file homepage structure and add one focused stylesheet for the navigation. Reuse the existing mobile-menu state in `index.html`, add a tiny pure hash parser for the existing auth dialog, and copy the already-built trainer landing into the main static site with namespaced assets.

**Tech Stack:** Static HTML/CSS, existing DC component runtime, vanilla JavaScript, Node.js built-in test runner.

## Global Constraints

- Preserve the user's existing uncommitted changes in `index.html`; do not stage or commit unrelated hunks.
- The navigation is one compact, horizontally centered capsule whose width follows its content.
- Use RinoMove colors `#C72562`, `#A8BFE9`, and `#1C1B20`.
- Desktop labels: `Znajdź trenera`, `Jak to działa`, `Dla trenerów`, `Zaloguj się`, `Załóż konto`.
- Mobile keeps the logo, `Załóż konto`, and menu button visible.
- Minimum interactive target: 40 × 40 px.
- Preserve `prefers-reduced-motion` and provide a readable fallback without `backdrop-filter`.
- Do not change the hero in this plan; the approved dot motif belongs to the next design step.

---

### Task 1: Liquid-glass homepage navigation

**Files:**
- Create: `navigation.css`
- Create: `test/navigation-content.test.js`
- Modify: `index.html` at the document head, navigation markup around the current `site-nav`, and menu bindings near `toggleMenu`

**Interfaces:**
- Consumes: existing component state `menuOpen`, `toggleMenu`, `menuExpanded`, and `menuClass`
- Produces: anchors to `#trenerzy`, `#jak-to-dziala`, `dla-trenerow.html`, `panel.html#login`, and `panel.html#register`

- [ ] **Step 1: Write the failing navigation content tests**

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const cssPath = path.join(root, 'navigation.css')

test('client navigation exposes the approved destinations', () => {
  assert.match(html, /href="#trenerzy"[^>]*>Znajdź trenera</)
  assert.match(html, /href="#jak-to-dziala"[^>]*>Jak to działa</)
  assert.match(html, /href="dla-trenerow\.html"[^>]*>Dla trenerów</)
  assert.match(html, /href="panel\.html#login"[^>]*>Zaloguj się</)
  assert.match(html, /href="panel\.html#register"[^>]*>Załóż konto</)
})

test('navigation loads a focused liquid glass stylesheet', () => {
  assert.match(html, /href="navigation\.css"/)
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')
  assert.match(css, /width:\s*max-content/)
  assert.match(css, /backdrop-filter:\s*blur\(22px\)\s+saturate\(1\.45\)/)
  assert.match(css, /border-radius:\s*999px/)
  assert.match(css, /@supports\s+not\s*\(backdrop-filter:/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
})

test('mobile navigation keeps account creation outside the collapsed menu', () => {
  assert.match(html, /class="btn nav-mobile-cta"[^>]*href="panel\.html#register"/)
  assert.match(html, /aria-controls="main-menu"/)
})
```

- [ ] **Step 2: Run the navigation tests and verify RED**

Run: `node --test test/navigation-content.test.js`

Expected: FAIL because `navigation.css`, the approved links, and `nav-mobile-cta` do not exist yet.

- [ ] **Step 3: Add the minimal liquid-glass stylesheet**

Create `navigation.css` with the approved capsule and mobile dropdown. The required core declarations are:

```css
.nav-shell {
  position: sticky;
  top: 14px;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
}

.site-nav.liquid-glass-nav {
  position: relative;
  width: max-content;
  max-width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 7px 8px 7px 18px;
  border-radius: 999px;
  background: linear-gradient(115deg, rgba(255,255,255,.80), rgba(249,252,255,.64));
  backdrop-filter: blur(22px) saturate(1.45);
  -webkit-backdrop-filter: blur(22px) saturate(1.45);
  box-shadow: 0 18px 38px rgba(34,29,35,.16), 0 4px 10px rgba(34,29,35,.08), inset 0 1px 0 rgba(255,255,255,.96);
  outline: 1px solid rgba(255,255,255,.74);
  outline-offset: -1px;
  pointer-events: auto;
}

.liquid-glass-nav .desktop-nav { display: flex; align-items: center; gap: 21px; }
.nav-mobile-cta { display: none; }
.liquid-glass-nav .btn:active { transform: scale(.96); }

@supports not (backdrop-filter: blur(1px)) {
  .site-nav.liquid-glass-nav { background: rgba(255,255,255,.96); }
}

@media (max-width: 820px) {
  .site-nav.liquid-glass-nav { min-height: 58px; gap: 8px; padding-left: 11px; }
  .nav-mobile-cta, .mobile-menu-button { display: inline-flex; min-width: 40px; min-height: 40px; }
  .liquid-glass-nav .desktop-nav { position: absolute; top: calc(100% + 10px); left: 0; right: 0; display: none; }
  .liquid-glass-nav .desktop-nav.menu-open { display: flex; }
  .liquid-glass-nav .desktop-nav .nav-register { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .liquid-glass-nav .btn { transition: none; }
}
```

- [ ] **Step 4: Replace only the navigation markup and bind menu closing**

Load `navigation.css` in the document head, wrap the approved markup in `.nav-shell`, keep the existing DC bindings on the menu button, and add `closeMenu: () => this.setState({ menuOpen: false })` next to `toggleMenu`.

```html
<div class="nav-shell">
  <nav class="site-nav liquid-glass-nav" aria-label="Główna nawigacja" data-screen-label="Nawigacja">
    <a class="site-logo" href="#top"><img src="assets/Rino-logo-v9.png" alt=""><span>RinoMove</span></a>
    <div id="main-menu" class="desktop-nav {{ menuClass }}">
      <a href="#trenerzy" onClick="{{ closeMenu }}">Znajdź trenera</a>
      <a href="#jak-to-dziala" onClick="{{ closeMenu }}">Jak to działa</a>
      <a href="dla-trenerow.html" onClick="{{ closeMenu }}">Dla trenerów</a>
      <a href="panel.html#login" onClick="{{ closeMenu }}">Zaloguj się</a>
      <a class="btn btn-primary nav-register" href="panel.html#register">Załóż konto</a>
    </div>
    <a class="btn nav-mobile-cta" href="panel.html#register">Załóż konto</a>
    <button class="mobile-menu-button" type="button" onClick="{{ toggleMenu }}" aria-expanded="{{ menuExpanded }}" aria-controls="main-menu" aria-label="Otwórz lub zamknij menu">☰</button>
  </nav>
</div>
```

- [ ] **Step 5: Run the navigation tests and verify GREEN**

Run: `node --test test/navigation-content.test.js`

Expected: 3 tests pass.

- [ ] **Step 6: Preserve dirty worktree scope**

Run: `git diff -- index.html navigation.css test/navigation-content.test.js`

Expected: new navigation changes are visible and the pre-existing trainer-focused `index.html` changes remain intact. Commit `navigation.css` and `test/navigation-content.test.js`; leave `index.html` unstaged because it contained user changes before this task.

---

### Task 2: Login and registration deep links

**Files:**
- Create: `auth-route.js`
- Create: `test/auth-route.test.js`
- Modify: `panel.html` at the script includes
- Modify: `panel.js` after auth click handlers are registered

**Interfaces:**
- Produces: `RinoAuthRoute.modeFromHash(hash): 'login' | 'register' | null`
- Consumes: existing `setAuthMode(mode)`, `#authDialog`, and `showAccountState()`

- [ ] **Step 1: Write the failing pure routing tests**

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { modeFromHash } = require('../auth-route')

test('maps supported account hashes to auth modes', () => {
  assert.equal(modeFromHash('#login'), 'login')
  assert.equal(modeFromHash('#register'), 'register')
})

test('ignores unrelated hashes', () => {
  assert.equal(modeFromHash('#search'), null)
  assert.equal(modeFromHash(''), null)
})
```

- [ ] **Step 2: Run the auth routing tests and verify RED**

Run: `node --test test/auth-route.test.js`

Expected: FAIL with `Cannot find module '../auth-route'`.

- [ ] **Step 3: Implement the minimal hash parser**

```js
(function (root, factory) {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root) root.RinoAuthRoute = api
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function modeFromHash(hash) {
    return hash === '#login' || hash === '#register' ? hash.slice(1) : null
  }
  return { modeFromHash }
})
```

- [ ] **Step 4: Wire the existing dialog to the hash**

Load `<script src="auth-route.js"></script>` before `panel.js`. In `panel.js`, after registering the auth controls, add:

```js
const requestedAuthMode = window.RinoAuthRoute.modeFromHash(window.location.hash)
if (requestedAuthMode) {
  setAuthMode(requestedAuthMode)
  $('#authDialog').showModal()
  showAccountState()
}
```

- [ ] **Step 5: Run the routing and full tests**

Run: `npm test`

Expected: all navigation and auth routing tests pass.

- [ ] **Step 6: Commit only clean auth files**

Run: `git add auth-route.js panel.html panel.js test/auth-route.test.js && git commit -m "feat: open auth dialog from navigation links"`

---

### Task 3: Existing trainer landing as a subpage

**Files:**
- Create from existing source: `dla-trenerow.html`
- Copy and rename: `../Strona dla trenerów/assets/rino-logo.png` → `assets/trainer-landing-rino-logo.png`
- Copy and rename: `../Strona dla trenerów/assets/tennis-back-serve.png` → `assets/trainer-landing-tennis-back-serve.png`
- Create: `test/trainer-subpage.test.js`

**Interfaces:**
- Consumes: existing `../Strona dla trenerów/index.html`
- Produces: local static route `dla-trenerow.html` and namespaced assets under `assets/`

- [ ] **Step 1: Write the failing subpage test**

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('trainer landing is available as a local subpage', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  assert.match(html, /<title>RinoMove dla trenerów<\/title>/)
  assert.match(html, /href="index\.html"/)
  assert.match(html, /assets\/trainer-landing-rino-logo\.png/)
  assert.match(html, /assets\/trainer-landing-tennis-back-serve\.png/)
})

test('trainer landing assets are present', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'trainer-landing-rino-logo.png')), true)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'trainer-landing-tennis-back-serve.png')), true)
})
```

- [ ] **Step 2: Run the subpage test and verify RED**

Run: `node --test test/trainer-subpage.test.js`

Expected: FAIL because `dla-trenerow.html` does not exist.

- [ ] **Step 3: Reuse the existing trainer landing without redesigning it**

Copy the existing trainer HTML and two referenced assets. In the copied HTML only:

```html
<a class="brand" href="index.html"><img src="assets/trainer-landing-rino-logo.png" alt=""><span>Rino<span class="move">Move</span></span></a>
```

Replace the tennis image source with `assets/trainer-landing-tennis-back-serve.png`. Keep all section content, form behavior, and styles unchanged.

- [ ] **Step 4: Run the full automated test suite**

Run: `npm test`

Expected: all navigation, auth routing, and trainer subpage tests pass with zero failures.

- [ ] **Step 5: Visually verify both breakpoints**

Run: `npm start`, then inspect `http://localhost:8787/` at desktop width around 1440 px and mobile width around 390 px.

Verify: the capsule is centered and compact; liquid glass remains readable over the current hero; mobile shows logo, CTA, and menu without overlap; `Dla trenerów` opens the subpage; `#login` and `#register` open the correct auth mode.

- [ ] **Step 6: Commit the isolated subpage files**

Run: `git add dla-trenerow.html assets/trainer-landing-rino-logo.png assets/trainer-landing-tennis-back-serve.png test/trainer-subpage.test.js && git commit -m "feat: add trainer landing subpage"`

---

### Task 4: Final scope and regression verification

**Files:**
- Verify only; no new files expected

**Interfaces:**
- Consumes: deliverables from Tasks 1–3
- Produces: verified navigation checkpoint ready for user review

- [ ] **Step 1: Run all tests from a clean command**

Run: `npm test`

Expected: zero failed tests.

- [ ] **Step 2: Check whitespace and changed-file scope**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; existing unrelated untracked files remain untouched; `index.html` still contains both the user's earlier work and the new navigation changes.

- [ ] **Step 3: Present the working navigation checkpoint**

Show the desktop and mobile result to the user. Stop before editing the hero. Record the user's dot-motif preference for the next hero design cycle.
