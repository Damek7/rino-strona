# Trainer Hero Mascot Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the existing calendar/rating/profile cards and refine the trainer mascot cap to look only moderately oversized while the mascot continues to replace the rackets.

**Architecture:** Edit only the mascot bitmap and the trainer-hero-specific CSS. Keep the existing card markup and content untouched, remove the trainer-hero rule that hides those cards, and layer the mascot where the racket stage previously lived.

**Tech Stack:** Static HTML/CSS, built-in ImageGen edit, PNG alpha, Node.js built-in test runner, Playwright CLI.

## Global Constraints

- The calendar, rating, and trainer profile cards stay visible with unchanged HTML content.
- The mascot replaces only the former racket layer.
- The burgundy `TRENER` cap is approximately 20–30% wider than the mascot's head, slightly low-set, and does not dominate the body or hide the face and antennae.
- The mascot's left hand continues to hold the brim.
- Preserve unrelated worktree changes.

---

### Task 1: Refine the mascot asset

**Files:**
- Create: `tmp/imagegen/Rino-trener-3d-blue-v2-key.png`
- Modify: `assets/Rino-trener-3d-blue.png`

**Interfaces:**
- Consumes: current `assets/Rino-trener-3d-blue.png` as the edit target.
- Produces: the same project asset path with corrected cap proportions.

- [ ] **Step 1: Edit the current mascot with built-in ImageGen**

Change only the cap scale and its fit. Preserve body, face, two antennae, pose, left hand on the brim, colors, `TRENER` spelling, lighting, framing, and 3D style. Render on uniform `#00ff00` for local background removal.

- [ ] **Step 2: Inspect and remove the chroma key**

Confirm the cap is only moderately oversized, the face and antennae remain visible, `TRENER` is correct, and the left hand still touches the brim. Run the installed chroma-key helper and validate RGBA mode, transparent corners, and nonempty alpha coverage.

---

### Task 2: Restore the card layer with TDD

**Files:**
- Modify: `test/trainer-subpage.test.js`
- Modify: `dla-trenerow.html`

**Interfaces:**
- Consumes: existing `.availability-card`, `.rating-card`, `.trainer-card`, and `.hero-mascot-stage` markup.
- Produces: visible cards above the mascot layer on desktop and mobile.

- [ ] **Step 1: Add a failing contract assertion**

Assert that trainer-specific CSS does not contain a rule setting the three card selectors to `display:none`, and that all three card classes remain in the markup.

- [ ] **Step 2: Verify RED**

Run `node --test test/trainer-subpage.test.js` and require failure caused by the current hiding rule.

- [ ] **Step 3: Implement the smallest CSS correction**

Remove only the trainer-specific `display:none` declaration. Set `.hero-mascot-stage` to the former artwork layer and retain the cards' existing `z-index:2` positions. Adjust mascot width/offset only if needed to keep the face, hand, and cap readable around the cards.

- [ ] **Step 4: Verify GREEN**

Run `node --test test/trainer-subpage.test.js` and require all tests to pass.

---

### Task 3: Render and regression verification

**Files:**
- Verify: `dla-trenerow.html`
- Verify: `assets/Rino-trener-3d-blue.png`

**Interfaces:**
- Consumes: `http://127.0.0.1:8787/dla-trenerow.html`.
- Produces: verified layered hero at 1440 × 1000 and 390 × 844.

- [ ] **Step 1: Run `npm test`**

Require zero failures.

- [ ] **Step 2: Verify both browser viewports**

Confirm the calendar, rating, and trainer cards are visible; the mascot replaces the rackets beneath them; cap proportions match the “father's cap on a child” effect; `TRENER`, face, antennae, and left hand remain readable; and `scrollWidth === clientWidth`.

- [ ] **Step 3: Run final checks**

Run `npm test`, alpha validation, and `git diff --check`. Inspect the scoped diff and commit only the corrected asset, trainer page, test, spec, and plan.

## Plan self-review

- Coverage: card restoration, corrected cap scale, unchanged card content, left-hand pose, alpha, responsive composition, tests, and browser checks are explicit.
- Placeholder scan: no deferred requirements remain.
- Naming consistency: the existing asset and class names remain unchanged across code and tests.
