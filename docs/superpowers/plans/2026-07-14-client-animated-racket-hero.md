# Client Animated Racket Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rectangular hero artwork with three independent transparent 3D rackets, stagger their one-shot entrance, and refine the client-facing typography.

**Architecture:** Keep the existing static DC page and navigation unchanged. Generate three project-local alpha PNG assets, render them as independently positioned images inside one semantic scene, and use scoped CSS keyframes with a reduced-motion override. Extend the existing Node content-contract test before changing production markup or styles.

**Tech Stack:** Static HTML/CSS, existing DC runtime, PNG alpha assets, built-in image generation plus local chroma-key removal, Node.js built-in test runner.

## Global Constraints

- Exact animation order: squash, padel, tennis.
- The green tennis racket is the largest and frontmost object.
- No rectangular image background, card, border, or frame.
- Desktop split is approximately 45% copy and 55% racket scene.
- Existing navigation and all sections after hero remain unchanged.
- `prefers-reduced-motion: reduce` must reveal all rackets immediately.
- No new JavaScript or animation dependency.
- Preserve exactly two decorative edge dots.

---

### Task 1: Animated hero contract

**Files:**
- Modify: `test/client-hero.test.js`

**Interfaces:**
- Consumes: `index.html`, `hero.css`, and project asset paths.
- Produces: regression checks for three independent racket layers and reduced motion.

- [ ] **Step 1: Write the failing tests**

Add assertions that require:

```js
test('hero renders three independent transparent racket layers', () => {
  assert.match(html, /assets\/hero-racket-squash\.png/)
  assert.match(html, /assets\/hero-racket-padel\.png/)
  assert.match(html, /assets\/hero-racket-tennis\.png/)
  assert.equal((html.match(/class="hero-racket hero-racket--/g) || []).length, 3)
  assert.doesNotMatch(html, /assets\/hero-rackets-3d-v1\.png/)
})

test('rackets enter separately and respect reduced motion', () => {
  const css = fs.readFileSync(path.join(root, 'hero.css'), 'utf8')
  assert.match(css, /@keyframes\s+racket-enter-squash/)
  assert.match(css, /@keyframes\s+racket-enter-padel/)
  assert.match(css, /@keyframes\s+racket-enter-tennis/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(css, /animation:\s*none/)
})
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/client-hero.test.js`

Expected: FAIL because the current hero still uses one rectangular `hero-rackets-3d-v1.png` image and has no independent racket keyframes.

---

### Task 2: Transparent racket assets

**Files:**
- Create: `assets/hero-racket-squash.png`
- Create: `assets/hero-racket-padel.png`
- Create: `assets/hero-racket-tennis.png`
- Temporary: `tmp/imagegen/hero-racket-*-key.png`

**Interfaces:**
- Consumes: approved `assets/hero-rackets-3d-v1.png` as the visual reference.
- Produces: three same-style transparent alpha PNG files used by the hero scene.

- [ ] **Step 1: Inspect the approved reference**

Confirm the squash racket is graphite with blue accents, the padel racket is powder blue, and the tennis racket is pastel mint green with a cream grip.

- [ ] **Step 2: Generate one chroma-key source per racket**

Use the approved reference for style and perspective. Generate each opaque racket separately on perfectly flat `#ff00ff` with generous padding, no shadow, no text, no watermark, and no extra objects.

- [ ] **Step 3: Convert each source to alpha PNG**

Run the installed `remove_chroma_key.py` helper with:

```powershell
python "$HOME/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py" `
  --input <source> `
  --out <destination> `
  --auto-key border `
  --soft-matte `
  --transparent-threshold 12 `
  --opaque-threshold 220 `
  --despill
```

- [ ] **Step 4: Validate alpha output**

Confirm each final file uses RGBA, all four corners have alpha `0`, the racket covers a plausible portion of the canvas, and no magenta fringe is visible.

---

### Task 3: Scene, animation, and typography

**Files:**
- Modify: `index.html` inside `#top.client-hero`
- Modify: `hero.css`

**Interfaces:**
- Consumes: the three transparent PNGs from Task 2.
- Produces: `.hero-racket-stage` with `.hero-racket--squash`, `.hero-racket--padel`, and `.hero-racket--tennis` layers.

- [ ] **Step 1: Replace the single artwork figure**

Use one labeled scene and three independent images:

```html
<div class="hero-racket-stage" role="img" aria-label="Trzy rakiety 3D: squashowa, padlowa i tenisowa">
  <img class="hero-racket hero-racket--squash" src="assets/hero-racket-squash.png" alt="">
  <img class="hero-racket hero-racket--padel" src="assets/hero-racket-padel.png" alt="">
  <img class="hero-racket hero-racket--tennis" src="assets/hero-racket-tennis.png" alt="">
</div>
```

- [ ] **Step 2: Build the full-width right-side stage**

Use a relative scene without background, border, radius, or card shadow. Position the squash racket left/back, padel right/back, and tennis center/front. Keep all visual overflow clipped by the hero, not by the scene.

- [ ] **Step 3: Add the one-shot stagger**

Define `racket-enter-squash`, `racket-enter-padel`, and `racket-enter-tennis`. Start at opacity `0`: squash uses `translate(-80px, 70px) rotate(-18deg) scale(0.74)`, padel uses `translate(90px, 65px) rotate(18deg) scale(0.74)`, and tennis uses `translateY(110px) rotate(4deg) scale(0.72)`. Settle through a small `1.03–1.05` overshoot to the final transform. Start squash first, padel `140 ms` later, and tennis `280 ms` later.

- [ ] **Step 4: Refine typography**

Set the heading to Manrope `700`, reduce its desktop size, use line-height about `1.02`, and constrain its width for balanced wrapping. Keep the description in DM Sans with `text-wrap: pretty` and the eyebrow with calmer tracking.

- [ ] **Step 5: Add reduced-motion and responsive rules**

Inside `@media (prefers-reduced-motion: reduce)`, set `animation: none` and reveal each final transform immediately. At `920 px` stack the scene under the copy; at `600 px` keep the three rackets layered without horizontal overflow.

- [ ] **Step 6: Verify GREEN**

Run: `npm test`

Expected: all tests pass with zero failures.

---

### Task 4: Visual verification

**Files:**
- Verify: `index.html`
- Verify: `hero.css`
- Verify: `assets/hero-racket-squash.png`
- Verify: `assets/hero-racket-padel.png`
- Verify: `assets/hero-racket-tennis.png`

**Interfaces:**
- Consumes: local page at `http://127.0.0.1:8787/`.
- Produces: a desktop and mobile hero ready for approval.

- [ ] **Step 1: Verify desktop at 1440 × 1000**

Confirm the rackets occupy the right side without a rectangular backdrop, animate in the required order, the tennis racket is frontmost, and `scrollWidth === clientWidth`.

- [ ] **Step 2: Verify mobile at 390 × 844**

Confirm copy comes first, the stage is below it, all important racket parts remain visible, CTAs are at least `44 px`, and there is no horizontal overflow.

- [ ] **Step 3: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce` or inspect the computed animation name under that media query and confirm all rackets are immediately visible.

- [ ] **Step 4: Run final checks**

Run: `npm test`

Run: `git diff --check`

Expected: zero failed tests and a zero exit code from the whitespace check.

## Plan self-review

- Spec coverage: Tasks 2–4 cover independent transparent assets, composition, typography, stagger order, responsive behavior, accessibility, and reduced motion.
- Placeholder scan: no unfinished implementation markers remain.
- Naming consistency: asset paths and `hero-racket--*` classes are identical across tests, markup, CSS, and verification.
- Dirty worktree: implementation changes remain uncommitted unless they can be staged without including pre-existing user changes in `index.html`.
