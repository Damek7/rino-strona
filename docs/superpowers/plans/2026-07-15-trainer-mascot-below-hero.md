# Trainer Mascot Below Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Rino mascot from the trainer hero and place it beside the “Czym jest RinoMove?” card below the hero.

**Architecture:** Move the existing mascot markup from `.hero-visual` into a new `.trainer-mascot-showcase` inside a `.manifesto-layout` wrapper. Remove hero-specific mascot positioning, compact the now card-only hero visual, and stack the manifesto card above the mascot at 900 px and below.

**Tech Stack:** Static HTML/CSS, Node.js built-in test runner, Playwright with installed Chrome.

## Global Constraints

- Use the existing `assets/Rino-trener-3d-blue.png` asset without editing it.
- Keep the calendar, rating, and `Marek Kowalski` cards inside hero.
- The mascot must not overlap or visually belong to hero.
- Do not add new copy or unrelated UI elements.
- Preserve unrelated worktree changes.

---

### Task 1: Move the mascot below hero

**Files:**
- Modify: `test/trainer-subpage.test.js`
- Modify: `dla-trenerow.html`

**Interfaces:**
- Consumes: current `.hero-mascot-stage`, `.hero-trainer-mascot`, `.manifesto`, and `.manifesto-card` markup.
- Produces: one `.trainer-mascot-showcase` containing `.trainer-lower-mascot` inside `.manifesto-layout`, with no mascot markup in `.trainer-home-hero`.

- [ ] **Step 1: Add a failing structure test**

Read the hero and manifesto substrings separately. Assert that hero contains no `Rino-trener-3d-blue.png`, `.hero-mascot-stage`, or `.hero-trainer-mascot`; manifesto contains `.manifesto-layout`, `.trainer-mascot-showcase`, `.trainer-lower-mascot`, and the asset; and the asset occurs exactly once in the page.

- [ ] **Step 2: Verify RED**

Run `node --test test/trainer-subpage.test.js`. Expected: the new test fails because the mascot is still inside `.hero-visual`.

- [ ] **Step 3: Move the markup**

Remove the mascot block from `.hero-visual`. Wrap the existing manifesto content in `.wrap.manifesto-layout` and add a sibling `.trainer-mascot-showcase` with the same accessible label and an image using class `.trainer-lower-mascot`.

- [ ] **Step 4: Replace the styles**

Remove `.hero-mascot-stage`, `.hero-trainer-mascot`, and `trainerMascotEnter` rules. Set trainer hero visual heights to 520 px desktop, 500 px tablet, and 410 px mobile. Expand calendar right insets to 24 px desktop and 0 tablet. Add a two-column `.manifesto-layout` with a 260 px mascot column, a 390 px showcase height, and a 250 px image; stack at 900 px and reduce the image to 210 px on mobile.

- [ ] **Step 5: Verify GREEN**

Run `node --test test/trainer-subpage.test.js`. Expected: all trainer subpage tests pass.

- [ ] **Step 6: Verify responsive views**

Render 1440 × 1000, 768 × 900, and 390 × 844. Confirm the hero has no mascot, all three cards are visible, the mascot is inside manifesto, and `scrollWidth === clientWidth`.

- [ ] **Step 7: Run full verification and commit**

Run `npm test` and `git diff --check`. Commit only `dla-trenerow.html`, `test/trainer-subpage.test.js`, the spec, and this plan.

## Plan self-review

- Coverage: hero removal, lower placement, exact asset count, responsive stacking, card preservation, overflow, and browser checks are explicit.
- Placeholder scan: no deferred requirements remain.
- Selector consistency: new selectors are defined once and match the planned markup.
