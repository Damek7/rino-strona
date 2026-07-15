# Trainer Hero Compact Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the excess white space below `Czwartek`, place the `Marek Kowalski` card directly below the calendar, and expose more of the trainer mascot on desktop and tablet.

**Architecture:** Keep the existing absolute-layered hero and change only trainer-hero-specific CSS. Let the availability card use content-driven height, then position the trainer card with a small explicit gap; restore the existing mobile positioning at widths up to 620 px.

**Tech Stack:** Static HTML/CSS, Node.js built-in test runner, Playwright with installed Chrome.

## Global Constraints

- Preserve all hero copy, card content, and the current mascot asset.
- Keep `.rating-card` and `.hero-mascot-stage` in their current layers.
- Preserve the current layout at widths up to 620 px.
- Avoid horizontal overflow at 1440 × 1000, 768 × 900, and 390 × 844.
- Preserve unrelated worktree changes.

---

### Task 1: Compact the trainer hero card stack

**Files:**
- Modify: `test/trainer-subpage.test.js`
- Modify: `dla-trenerow.html`

**Interfaces:**
- Consumes: existing `.trainer-home-hero .availability-card`, `.trainer-card`, and mobile media-query rules.
- Produces: content-height calendar and a trainer card positioned 21 px below it on desktop/tablet, with existing mobile placement restored at 620 px and below.

- [ ] **Step 1: Add a failing contract test**

Add a test that requires the trainer-specific availability rule to use `bottom:auto`, the trainer card to use `top:400px;bottom:auto`, the tablet rule to use `top:382px`, and the mobile rule to restore `top:auto;bottom:0`.

- [ ] **Step 2: Verify RED**

Run `node --test test/trainer-subpage.test.js`. Expected: the new compact-layout test fails because the current availability card still has a bottom inset and the trainer card still uses the base bottom position.

- [ ] **Step 3: Implement the minimal CSS change**

In `dla-trenerow.html`, change the desktop availability inset to `78px 210px auto 0`; add `.trainer-home-hero .trainer-card{top:400px;bottom:auto}`; change the tablet availability inset to `60px 180px auto 0` and trainer top to `382px`; restore `.trainer-home-hero .trainer-card{top:auto;bottom:0}` inside the max-620px query.

- [ ] **Step 4: Verify GREEN**

Run `node --test test/trainer-subpage.test.js`. Expected: all trainer subpage tests pass.

- [ ] **Step 5: Verify responsive geometry**

Render the hero at 1440 × 1000, 768 × 900, and 390 × 844. Confirm all four visual elements remain visible, `scrollWidth === clientWidth`, and the desktop/tablet vertical gap from the calendar to trainer card is between 18 and 24 px.

- [ ] **Step 6: Run the full suite and commit**

Run `npm test` and `git diff --check`. Commit only `dla-trenerow.html`, `test/trainer-subpage.test.js`, the spec, and this plan.

## Plan self-review

- Coverage: compact card height, trainer-card gap, mascot visibility, mobile preservation, overflow, tests, and browser verification are explicit.
- Placeholder scan: no deferred or ambiguous steps remain.
- Selector consistency: all selectors match the existing trainer hero markup and stylesheet.
