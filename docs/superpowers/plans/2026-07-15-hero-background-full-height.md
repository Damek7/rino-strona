# Hero Background Full Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the white strip below the homepage hero by making its existing gradient background cover the full viewport height.

**Architecture:** Keep the current navigation, content, racket layers, and responsive layout unchanged. Change only the minimum height of the hero background container and its inner layout from a viewport height reduced by 82px to the full dynamic viewport height.

**Tech Stack:** HTML, CSS, Node.js built-in test runner, Playwright CLI.

## Global Constraints

- Do not modify or regenerate any racket image.
- Preserve the existing hero layout and content.
- The hero background must reach the bottom edge of the viewport without a white strip.
- Content taller than the viewport must continue to expand naturally.

---

### Task 1: Cover the full viewport with the hero background

**Files:**
- Modify: `hero.css`
- Test: `test/client-hero.test.js`

**Interfaces:**
- Consumes: existing `#top.client-hero` and `#top.client-hero .hero` selectors.
- Produces: full-height background coverage through `min-height: 100dvh`.

- [ ] **Step 1: Write the failing test**

```js
test('homepage hero background covers the full viewport height', () => {
  const css = fs.readFileSync(path.join(root, 'hero.css'), 'utf8')

  assert.match(css, /#top\.client-hero\s*\{[^}]*min-height:\s*100dvh;/s)
  assert.match(css, /#top\.client-hero \.hero\s*\{[^}]*min-height:\s*100dvh;/s)
  assert.doesNotMatch(css, /min-height:\s*calc\(100dvh - 82px\)/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/client-hero.test.js`

Expected: FAIL because `hero.css` still uses `min-height: calc(100dvh - 82px)`.

- [ ] **Step 3: Implement the minimal CSS change**

```css
#top.client-hero {
  min-height: 100dvh;
}

#top.client-hero .hero {
  min-height: 100dvh;
}
```

Keep all other declarations unchanged.

- [ ] **Step 4: Verify GREEN and inspect the rendered edge**

Run: `node --test test/client-hero.test.js`

Expected: PASS.

Use Playwright at desktop and mobile widths. Confirm the hero bottom equals or exceeds the viewport bottom and the gradient, not the page background, occupies the final row of pixels.

- [ ] **Step 5: Run the complete test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 6: Commit the focused change**

```bash
git add hero.css test/client-hero.test.js docs/superpowers/plans/2026-07-15-hero-background-full-height.md
git commit -m "fix: extend hero background to viewport edge"
```
