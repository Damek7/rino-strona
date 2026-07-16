# Public Subpage Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the homepage liquid-glass navigation to the trainer landing and four legal subpages without changing the application panel.

**Architecture:** Reuse the existing `navigation.css` and duplicate the small static navigation markup in each public subpage so navigation remains visible without JavaScript. Add one UMD-style `public-navigation.js` module that only manages the mobile open state on static subpages; the homepage keeps its existing runtime bindings.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript, Node.js built-in test runner, Playwright for visual checks.

## Global Constraints

- Modify only `dla-trenerow.html`, `cookies.html`, `polityka-prywatnosci.html`, `regulamin.html`, `rodo.html`, `navigation.css`, `legal-placeholder.css`, the new mobile-menu module, and focused tests.
- Do not modify `panel.html` or its role-based application navigation.
- Keep the homepage labels and order: `Jak to działa`, `Dla trenerów`, `Zapisz się`.
- On subpages, use `index.html#top`, `index.html#jak-to-dziala`, `dla-trenerow.html`, and `index.html#zapisy`.
- Add `aria-current="page"` only to `Dla trenerów` on `dla-trenerow.html`.
- Preserve the existing `backdrop-filter` fallback, `prefers-reduced-motion` behavior, and minimum 40 × 40 px interactive targets.
- Preserve all unrelated dirty-worktree changes and do not reformat page content.

---

### Task 1: Self-contained shared navigation and mobile controller

**Files:**
- Create: `public-navigation.js`
- Create: `test/public-navigation.test.js`
- Modify: `navigation.css`

**Interfaces:**
- Produces: `RinoPublicNavigation.setMenuOpen(toggle, menu, isOpen): void`
- Produces: `RinoPublicNavigation.initNavigation(documentRoot): void`
- Consumes: `.public-navigation`, `.mobile-menu-button`, `#main-menu`, and the `menu-open` class.

- [ ] **Step 1: Write the failing mobile-controller tests**

Create `test/public-navigation.test.js`:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { setMenuOpen, initNavigation } = require('../public-navigation')

function fakeElement(initialAttributes = {}) {
  const attributes = { ...initialAttributes }
  const classes = new Set()
  const listeners = {}

  return {
    listeners,
    classList: {
      toggle(name, force) {
        if (force) classes.add(name)
        else classes.delete(name)
      },
      contains(name) {
        return classes.has(name)
      },
    },
    getAttribute(name) {
      return attributes[name] ?? null
    },
    setAttribute(name, value) {
      attributes[name] = value
    },
    addEventListener(name, listener) {
      listeners[name] = listener
    },
  }
}

test('setMenuOpen synchronizes menu class and expanded state', () => {
  const toggle = fakeElement({ 'aria-expanded': 'false' })
  const menu = fakeElement()

  setMenuOpen(toggle, menu, true)
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  assert.equal(menu.classList.contains('menu-open'), true)

  setMenuOpen(toggle, menu, false)
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(menu.classList.contains('menu-open'), false)
})

test('initNavigation toggles the menu and closes it after choosing a link', () => {
  const toggle = fakeElement({ 'aria-expanded': 'false' })
  const menu = fakeElement()
  const navigation = {
    querySelector(selector) {
      return selector === '.mobile-menu-button' ? toggle : menu
    },
  }
  const documentRoot = {
    querySelector(selector) {
      return selector === '.public-navigation' ? navigation : null
    },
  }

  initNavigation(documentRoot)
  toggle.listeners.click()
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  assert.equal(menu.classList.contains('menu-open'), true)

  menu.listeners.click({ target: { closest: selector => selector === 'a' ? {} : null } })
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(menu.classList.contains('menu-open'), false)
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/public-navigation.test.js`

Expected: FAIL with `Cannot find module '../public-navigation'`.

- [ ] **Step 3: Implement the minimal mobile controller**

Create `public-navigation.js`:

```js
(function (root, factory) {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root) root.RinoPublicNavigation = api
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function setMenuOpen(toggle, menu, isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen))
    menu.classList.toggle('menu-open', isOpen)
  }

  function initNavigation(documentRoot) {
    const navigation = documentRoot.querySelector('.public-navigation')
    if (!navigation) return

    const toggle = navigation.querySelector('.mobile-menu-button')
    const menu = navigation.querySelector('#main-menu')
    if (!toggle || !menu) return

    toggle.addEventListener('click', () => {
      setMenuOpen(toggle, menu, toggle.getAttribute('aria-expanded') !== 'true')
    })
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) setMenuOpen(toggle, menu, false)
    })
  }

  if (root && root.document) {
    root.addEventListener('DOMContentLoaded', () => initNavigation(root.document))
  }

  return { setMenuOpen, initNavigation }
})
```

- [ ] **Step 4: Run the controller tests and verify GREEN**

Run: `node --test test/public-navigation.test.js`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Write and verify the failing shared-stylesheet test**

Append to `test/public-navigation.test.js`:

```js
test('navigation stylesheet is self-contained and reserves subpage space', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'navigation.css'), 'utf8')
  assert.match(css, /\.site-nav\.liquid-glass-nav\s*\{[^}]*margin:\s*0;/s)
  assert.match(css, /\.liquid-glass-nav \.site-logo\s*\{[^}]*display:\s*flex;/s)
  assert.match(css, /\.liquid-glass-nav \.mobile-menu-button\s*\{[^}]*display:\s*none;/s)
  assert.match(css, /\.public-subpage \.nav-shell\s*\{[^}]*height:\s*78px;[^}]*margin-bottom:\s*0;/s)
  assert.match(css, /@media\s*\(max-width:\s*820px\)[\s\S]*?\.public-subpage \.nav-shell\s*\{[^}]*height:\s*68px;/)
})
```

Run: `node --test --test-name-pattern="navigation stylesheet" test/public-navigation.test.js`

Expected: FAIL because the existing stylesheet depends on homepage base styles and keeps the negative flow margin on all pages.

- [ ] **Step 6: Make `navigation.css` self-contained for static pages**

Add `margin: 0` and the font family inside `.site-nav.liquid-glass-nav`:

```css
.site-nav.liquid-glass-nav {
  margin: 0;
  font-family: 'Manrope', system-ui, sans-serif;
}
```

Merge these declarations into the existing selector rather than creating a duplicate block. Then add the shared base rules immediately before the existing `.liquid-glass-nav .site-logo` rule:

```css
.liquid-glass-nav a {
  color: inherit;
  text-decoration: none;
}

.liquid-glass-nav .site-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.liquid-glass-nav .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Manrope', system-ui, sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition-property: transform, background-color, box-shadow;
  transition-duration: 180ms;
  transition-timing-function: cubic-bezier(.2, 0, 0, 1);
}

.liquid-glass-nav .mobile-menu-button {
  display: none;
  padding: 0;
  color: #17161B;
  font: 700 14px 'Manrope', system-ui, sans-serif;
  cursor: pointer;
}

.public-subpage .nav-shell {
  top: 0;
  height: 78px;
  margin-bottom: 0;
  padding-top: 14px;
}
```

Inside the existing `@media (max-width: 820px)` block, add:

```css
  .public-subpage .nav-shell {
    top: 0;
    height: 68px;
    margin-bottom: 0;
    padding-top: 10px;
  }
```

- [ ] **Step 7: Run the focused tests and verify GREEN**

Run: `node --test test/public-navigation.test.js`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 8: Check the focused diff**

Run: `git diff --check -- navigation.css public-navigation.js test/public-navigation.test.js`

Expected: no output.

---

### Task 2: Replace the trainer landing navigation

**Files:**
- Modify: `dla-trenerow.html`
- Create: `test/public-subpage-navigation.test.js`

**Interfaces:**
- Consumes: `navigation.css`, `public-navigation.js`, and the `public-navigation` controller contract from Task 1.
- Produces: the shared static navigation markup with `aria-current="page"` on the trainer link.

- [ ] **Step 1: Write the failing trainer-subpage test**

Create `test/public-subpage-navigation.test.js`:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

function readPage(name) {
  return fs.readFileSync(path.join(root, name), 'utf8')
}

function assertSharedNavigation(html) {
  assert.match(html, /<body class="public-subpage">/)
  assert.match(html, /href="navigation\.css"/)
  assert.match(html, /class="site-nav liquid-glass-nav public-navigation"/)
  assert.match(html, /href="index\.html#top"[^>]*aria-label="RinoMove — strona główna"/)
  assert.match(html, /href="index\.html#jak-to-dziala"[^>]*>Jak to działa</)
  assert.match(html, /href="dla-trenerow\.html"[^>]*>Dla trenerów</)
  assert.match(html, /class="btn btn-primary nav-register" href="index\.html#zapisy">Zapisz się</)
  assert.match(html, /class="btn nav-mobile-cta" href="index\.html#zapisy">Zapisz się</)
  assert.match(html, /aria-expanded="false"[^>]*aria-controls="main-menu"/)
  assert.match(html, /src="public-navigation\.js"/)
}

test('trainer landing uses the homepage navigation with current-page semantics', () => {
  const html = readPage('dla-trenerow.html')
  assertSharedNavigation(html)
  assert.match(html, /href="dla-trenerow\.html" aria-current="page">Dla trenerów</)
  assert.doesNotMatch(html, /class="mobile-menu-toggle"/)
})
```

- [ ] **Step 2: Run the trainer test and verify RED**

Run: `node --test test/public-subpage-navigation.test.js`

Expected: FAIL because `dla-trenerow.html` still contains its original `.site-nav` and `.mobile-menu-toggle` markup.

- [ ] **Step 3: Load the shared stylesheet and mark the page as public**

In `dla-trenerow.html`, add this after the existing inline `<style>` block:

```html
  <link rel="stylesheet" href="navigation.css">
```

Change the body start tag to:

```html
<body class="public-subpage">
```

- [ ] **Step 4: Replace only the original trainer header with shared markup**

Replace the existing `<header class="site-nav">...</header>` with:

```html
  <div class="nav-shell">
    <nav class="site-nav liquid-glass-nav public-navigation" aria-label="Główna nawigacja">
      <a class="site-logo" href="index.html#top" aria-label="RinoMove — strona główna">
        <img src="assets/Rino-logo-v10.png" alt="">
        <img class="site-wordmark" src="assets/rino-move-wordmark.png" alt="Rino Move">
      </a>
      <div id="main-menu" class="desktop-nav">
        <a href="index.html#jak-to-dziala">Jak to działa</a>
        <a href="dla-trenerow.html" aria-current="page">Dla trenerów</a>
        <a class="btn btn-primary nav-register" href="index.html#zapisy">Zapisz się</a>
      </div>
      <a class="btn nav-mobile-cta" href="index.html#zapisy">Zapisz się</a>
      <button class="mobile-menu-button" type="button" aria-expanded="false" aria-controls="main-menu" aria-label="Otwórz lub zamknij menu">☰</button>
    </nav>
  </div>
```

- [ ] **Step 5: Replace the old inline menu script**

Remove the inline script that queries `.mobile-menu-toggle` and `#primary-navigation`. Load the shared controller immediately before the existing trainer form script:

```html
  <script src="public-navigation.js"></script>
  <script src="trainer-signup.js"></script>
```

- [ ] **Step 6: Run the trainer and existing trainer tests**

Run: `node --test test/public-subpage-navigation.test.js test/trainer-subpage.test.js test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js`

Expected: all tests pass, 0 fail.

- [ ] **Step 7: Check the focused diff**

Run: `git diff --check -- dla-trenerow.html test/public-subpage-navigation.test.js`

Expected: no output.

---

### Task 3: Add shared navigation to all four legal subpages

**Files:**
- Modify: `cookies.html`
- Modify: `polityka-prywatnosci.html`
- Modify: `regulamin.html`
- Modify: `rodo.html`
- Modify: `legal-placeholder.css`
- Modify: `test/public-subpage-navigation.test.js`

**Interfaces:**
- Consumes: `navigation.css`, `public-navigation.js`, and `assertSharedNavigation(html)` from Task 2.
- Produces: four public legal pages with the same static navigation and no current-page marker.

- [ ] **Step 1: Extend the test to cover every legal page**

Append to `test/public-subpage-navigation.test.js`:

```js
const legalPages = [
  'cookies.html',
  'polityka-prywatnosci.html',
  'regulamin.html',
  'rodo.html',
]

for (const page of legalPages) {
  test(`${page} uses the homepage navigation`, () => {
    const html = readPage(page)
    assertSharedNavigation(html)
    assert.doesNotMatch(html, /aria-current="page"/)
  })
}

test('legal layout keeps the document card below the shared navigation', () => {
  const css = fs.readFileSync(path.join(root, 'legal-placeholder.css'), 'utf8')
  assert.match(css, /body\.public-subpage\s*\{[^}]*display:\s*block;[^}]*padding:\s*0 24px 24px;/s)
  assert.match(css, /\.public-subpage \.legal-placeholder\s*\{[^}]*margin:\s*24px auto 0;/s)
})
```

- [ ] **Step 2: Run the legal-page tests and verify RED**

Run: `node --test test/public-subpage-navigation.test.js`

Expected: the trainer test passes and five tests fail: four pages do not yet contain shared navigation, and `legal-placeholder.css` still centers the whole body as a grid.

- [ ] **Step 3: Add shared head resources to every legal page**

In each of the four legal files, keep its existing title and `legal-placeholder.css`, and add these lines before `</head>`:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="navigation.css">
```

Change each body start tag to:

```html
<body class="public-subpage">
```

- [ ] **Step 4: Insert the shared legal-page navigation**

Immediately after `<body class="public-subpage">` in all four legal pages, insert this exact markup:

```html
  <div class="nav-shell">
    <nav class="site-nav liquid-glass-nav public-navigation" aria-label="Główna nawigacja">
      <a class="site-logo" href="index.html#top" aria-label="RinoMove — strona główna">
        <img src="assets/Rino-logo-v10.png" alt="">
        <img class="site-wordmark" src="assets/rino-move-wordmark.png" alt="Rino Move">
      </a>
      <div id="main-menu" class="desktop-nav">
        <a href="index.html#jak-to-dziala">Jak to działa</a>
        <a href="dla-trenerow.html">Dla trenerów</a>
        <a class="btn btn-primary nav-register" href="index.html#zapisy">Zapisz się</a>
      </div>
      <a class="btn nav-mobile-cta" href="index.html#zapisy">Zapisz się</a>
      <button class="mobile-menu-button" type="button" aria-expanded="false" aria-controls="main-menu" aria-label="Otwórz lub zamknij menu">☰</button>
    </nav>
  </div>
```

Keep each existing `.legal-placeholder` main element and its copy unchanged.

- [ ] **Step 5: Load the controller on every legal page**

Immediately before `</body>` in all four legal pages, add:

```html
  <script src="public-navigation.js"></script>
```

- [ ] **Step 6: Keep the legal cards below the navigation**

Append to `legal-placeholder.css`:

```css
body.public-subpage {
  display: block;
  padding: 0 24px 24px;
}

.public-subpage .legal-placeholder {
  margin: 24px auto 0;
}
```

This override applies only to pages that load `legal-placeholder.css`; it removes the old whole-body centering that would otherwise treat the navigation and legal card as two centered grid items.

- [ ] **Step 7: Run all public-navigation tests and verify GREEN**

Run: `node --test test/public-navigation.test.js test/public-subpage-navigation.test.js`

Expected: 8 tests pass, 0 fail.

- [ ] **Step 8: Check the focused diff**

Run: `git diff --check -- cookies.html polityka-prywatnosci.html regulamin.html rodo.html legal-placeholder.css test/public-subpage-navigation.test.js`

Expected: no output.

---

### Task 4: Regression and visual verification

**Files:**
- Verify only; no new production files expected.

**Interfaces:**
- Consumes: all navigation changes from Tasks 1–3.
- Produces: evidence that tests, desktop layout, mobile layout, and mobile menu behavior meet the approved design.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

Expected: all tests pass with 0 failures and no uncaught errors.

- [ ] **Step 2: Start the local server**

Run in a background terminal: `npm start`

Expected: server listens at `http://localhost:8787`.

- [ ] **Step 3: Capture representative desktop and mobile pages**

Run:

```powershell
npx playwright screenshot --viewport-size="1440,900" http://localhost:8787/dla-trenerow.html tmp/trainer-navigation-desktop.png
npx playwright screenshot --device="iPhone 13" http://localhost:8787/dla-trenerow.html tmp/trainer-navigation-mobile.png
npx playwright screenshot --viewport-size="1440,900" http://localhost:8787/regulamin.html tmp/legal-navigation-desktop.png
npx playwright screenshot --device="iPhone 13" http://localhost:8787/regulamin.html tmp/legal-navigation-mobile.png
```

Expected: all four screenshots are created. The capsule matches the homepage, content begins below it, and no element overlaps or clips.

- [ ] **Step 4: Verify the mobile interaction in a real browser**

Open `http://localhost:8787/dla-trenerow.html` at about 390 px width. Click the menu button, verify all links appear and `aria-expanded` becomes `true`; choose a link and verify the menu closes and `aria-expanded` returns to `false`.

- [ ] **Step 5: Verify changed-file scope and whitespace**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors. Only the approved navigation files and tests are attributable to this implementation; the pre-existing modified `index.html` and unrelated untracked files remain untouched.

- [ ] **Step 6: Commit the implementation files only**

```powershell
git add -- navigation.css legal-placeholder.css public-navigation.js dla-trenerow.html cookies.html polityka-prywatnosci.html regulamin.html rodo.html test/public-navigation.test.js test/public-subpage-navigation.test.js
git commit -m "feat: unify public subpage navigation"
```

Expected: one implementation commit containing only the approved public-navigation scope.
