# Contextual Subpage Navigation Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic public-subpage navigation labels with trainer-specific section links and a single home-return action on legal pages.

**Architecture:** Keep the existing shared liquid-glass CSS and mobile controller. Change only navigation markup and its focused structural tests: the trainer page remains interactive on mobile, while legal pages become static two-item capsules that do not load the controller.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript, Node.js built-in test runner, Playwright CLI.

## Global Constraints

- Keep the existing liquid-glass appearance and spacing.
- Do not modify `index.html` or `panel.html`.
- Trainer desktop order: `Strona główna`, `Korzyści`, `Program`, `Jak dołączyć`, `Zapisz się`.
- Trainer destinations: `index.html#top`, `#korzysci`, `#program`, `#jak`, `#kontakt`.
- Legal pages contain only the logo and `Wróć na stronę główną`, both targeting `index.html#top`.
- Only `dla-trenerow.html` loads `public-navigation.js`.
- Preserve all page content outside navigation.

---

### Task 1: Contextual trainer navigation

**Files:**
- Modify: `dla-trenerow.html`
- Modify: `test/public-subpage-navigation.test.js`
- Modify: `test/trainer-subpage.test.js`

**Interfaces:**
- Consumes: existing `public-navigation.js` behavior and `#korzysci`, `#program`, `#jak`, `#kontakt` section IDs.
- Produces: trainer-specific desktop and mobile navigation destinations.

- [ ] **Step 1: Replace the common test helper and write the failing trainer assertions**

In `test/public-subpage-navigation.test.js`, replace `assertSharedNavigation` with:

```js
function assertNavigationShell(html) {
  assert.match(html, /<body class="public-subpage">/)
  assert.match(html, /href="navigation\.css"/)
  assert.match(html, /class="site-nav liquid-glass-nav[^\"]*"/)
  assert.match(html, /href="index\.html#top"[^>]*aria-label="RinoMove — strona główna"/)
}
```

Update the trainer test to:

```js
test('trainer landing uses contextual section navigation', () => {
  const html = readPage('dla-trenerow.html')
  assertNavigationShell(html)
  assert.match(html, /class="site-nav liquid-glass-nav public-navigation"/)
  assert.match(html, /href="index\.html#top">Strona główna</)
  assert.match(html, /href="#korzysci">Korzyści</)
  assert.match(html, /href="#program">Program</)
  assert.match(html, /href="#jak">Jak dołączyć</)
  assert.match(html, /class="btn btn-primary nav-register" href="#kontakt">Zapisz się</)
  assert.match(html, /class="btn nav-mobile-cta" href="#kontakt">Zapisz się</)
  assert.match(html, /aria-expanded="false"[^>]*aria-controls="main-menu"/)
  assert.match(html, /src="public-navigation\.js"/)
  assert.doesNotMatch(html, />Jak to działa<|>Dla trenerów</)
})
```

In the legal-page loop, change `assertSharedNavigation(html)` to `assertNavigationShell(html)` so the legal behavior can be tightened in Task 2.

In `test/trainer-subpage.test.js`, replace the old `index.html#jak-to-dziala` assertion with:

```js
  assert.match(html, /href="index\.html#top">Strona główna</)
  assert.match(html, /href="#program">Program</)
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test test/public-subpage-navigation.test.js test/trainer-subpage.test.js`

Expected: FAIL because the trainer navigation still contains `Jak to działa`, `Dla trenerów`, and CTA links to `index.html#zapisy`.

- [ ] **Step 3: Replace the trainer menu links**

In `dla-trenerow.html`, keep the existing logo, wrapper, and menu button. Replace the contents of `#main-menu` and the mobile CTA with:

```html
      <div id="main-menu" class="desktop-nav">
        <a href="index.html#top">Strona główna</a>
        <a href="#korzysci">Korzyści</a>
        <a href="#program">Program</a>
        <a href="#jak">Jak dołączyć</a>
        <a class="btn btn-primary nav-register" href="#kontakt">Zapisz się</a>
      </div>
      <a class="btn nav-mobile-cta" href="#kontakt">Zapisz się</a>
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `node --test test/public-subpage-navigation.test.js test/trainer-subpage.test.js`

Expected: all focused tests pass with 0 failures.

---

### Task 2: Minimal legal-page navigation

**Files:**
- Modify: `cookies.html`
- Modify: `polityka-prywatnosci.html`
- Modify: `regulamin.html`
- Modify: `rodo.html`
- Modify: `test/public-subpage-navigation.test.js`

**Interfaces:**
- Consumes: shared `navigation.css` and `assertNavigationShell(html)` from Task 1.
- Produces: a static `.legal-navigation` capsule with no JavaScript controller dependency.

- [ ] **Step 1: Tighten the legal-page assertions**

Replace the body of the legal-page loop test with:

```js
  test(`${page} uses a minimal home-return navigation`, () => {
    const html = readPage(page)
    assertNavigationShell(html)
    assert.match(html, /class="site-nav liquid-glass-nav legal-navigation"/)
    assert.match(html, /class="btn nav-register legal-home-link" href="index\.html#top">Wróć na stronę główną</)
    assert.doesNotMatch(html, /id="main-menu"|nav-mobile-cta|mobile-menu-button/)
    assert.doesNotMatch(html, /src="public-navigation\.js"/)
    assert.doesNotMatch(html, />Jak to działa<|>Dla trenerów<|>Zapisz się</)
  })
```

- [ ] **Step 2: Run the legal tests and verify RED**

Run: `node --test test/public-subpage-navigation.test.js`

Expected: four legal-page tests fail because they still contain the full menu, mobile button, CTA, and controller script.

- [ ] **Step 3: Replace each legal navigation with the minimal capsule**

In `cookies.html`, `polityka-prywatnosci.html`, `regulamin.html`, and `rodo.html`, replace the complete `.nav-shell` with:

```html
  <div class="nav-shell">
    <nav class="site-nav liquid-glass-nav legal-navigation" aria-label="Nawigacja powrotna">
      <a class="site-logo" href="index.html#top" aria-label="RinoMove — strona główna">
        <img src="assets/Rino-logo-v10.png" alt="">
        <img class="site-wordmark" src="assets/rino-move-wordmark.png" alt="Rino Move">
      </a>
      <a class="btn nav-register legal-home-link" href="index.html#top">Wróć na stronę główną</a>
    </nav>
  </div>
```

Remove this line from all four legal pages:

```html
  <script src="public-navigation.js"></script>
```

- [ ] **Step 4: Run all navigation tests and verify GREEN**

Run: `node --test test/public-navigation.test.js test/public-subpage-navigation.test.js test/trainer-subpage.test.js`

Expected: all navigation and trainer-subpage tests pass with 0 failures.

---

### Task 3: Regression and visual verification

**Files:**
- Verify only; no additional production files expected.

**Interfaces:**
- Consumes: contextual navigation from Tasks 1–2.
- Produces: verified desktop/mobile screenshots and a clean implementation commit.

- [ ] **Step 1: Run the full suite**

Run: `npm test`

Expected: all tests pass with 0 failures.

- [ ] **Step 2: Run the worktree server on port 8791**

Run with `PORT=8791`: `node server.js`

Expected: `http://localhost:8791/dla-trenerow.html` and `http://localhost:8791/regulamin.html` return HTTP 200.

- [ ] **Step 3: Verify desktop and mobile in Playwright CLI**

Capture the trainer and legal pages at 1440 × 900 and 390 × 844. Verify:

- trainer desktop shows all five approved labels once;
- trainer mobile keeps logo, `Zapisz się`, and the menu button without clipping;
- the opened mobile menu shows four contextual links;
- legal pages show only logo and `Wróć na stronę główną`;
- console reports 0 errors and 0 warnings.

- [ ] **Step 4: Commit the contextual correction**

```powershell
git add -- dla-trenerow.html cookies.html polityka-prywatnosci.html regulamin.html rodo.html test/public-subpage-navigation.test.js test/trainer-subpage.test.js
git commit -m "fix: tailor public subpage navigation copy"
```

Expected: one focused correction commit with no unrelated files.
