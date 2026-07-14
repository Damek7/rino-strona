# Trainer Hero 3D Mascot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three rackets in the trainer landing hero with a responsive Rino 3D mascot wearing an intentionally oversized burgundy `TRENER` cap and holding its brim with the left hand.

**Architecture:** Keep the existing trainer landing structure and overlay cards. Add one transparent PNG asset, replace only the racket-stage markup, and add narrowly scoped styles in the page's existing inline stylesheet. Extend the current trainer subpage contract test before changing production markup.

**Tech Stack:** Static HTML/CSS, PNG with alpha, Node.js built-in test runner, local image generation and chroma-key removal, browser verification.

## Global Constraints

- Preserve the canonical light-blue two-antenna Rino silhouette and friendly 3D material style.
- The burgundy cap is deliberately much too large, remains on the head, and its brim is held by the mascot's left hand.
- The cap contains the exact, readable text `TRENER` and no other text.
- Remove rackets only from `dla-trenerow.html`; preserve the three overlay cards and all other page content.
- Preserve responsive behavior, accessibility, and `prefers-reduced-motion` support.
- Do not alter unrelated dirty worktree files.

---

### Task 1: Generate and validate the mascot asset

**Files:**
- Create: `tmp/imagegen/Rino-trener-3d-blue-key.png`
- Create: `assets/Rino-trener-3d-blue.png`

**Interfaces:**
- Consumes: existing `assets/Rino-tenis-serve-3d-blue.png` as a character/style reference.
- Produces: a project-local transparent PNG used by trainer hero markup.

- [ ] **Step 1: Generate the chroma-key source**

Use the built-in image generation tool with the existing Rino image as a style/character reference and require: full-body front-facing light-blue Rino; exactly two antennas; oversized burgundy baseball cap on the head; exact light text `TRENER`; character's left hand holding the brim; flat `#00ff00` background; no ground, shadow, sports equipment, extra text, or watermark.

- [ ] **Step 2: Inspect the source**

Verify visually that the cap is unmistakably oversized, the text is spelled correctly, the correct hand touches the brim, and the canonical silhouette is preserved. If one invariant fails, make one targeted image edit and inspect again.

- [ ] **Step 3: Remove the chroma key**

Run:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py" --input tmp/imagegen/Rino-trener-3d-blue-key.png --out assets/Rino-trener-3d-blue.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

Expected: exit code `0` and an RGBA PNG in `assets/`.

- [ ] **Step 4: Validate alpha and coverage**

Use Pillow to assert mode includes alpha, all four corner alpha values are `0`, and the nontransparent bounding box is nonempty and does not touch the image edges.

---

### Task 2: Add the trainer hero contract with TDD

**Files:**
- Modify: `test/trainer-subpage.test.js`
- Modify: `dla-trenerow.html`

**Interfaces:**
- Consumes: `assets/Rino-trener-3d-blue.png`.
- Produces: `.hero-mascot-stage` and `.hero-trainer-mascot` markup with accessible description.

- [ ] **Step 1: Write the failing contract test**

Add a test that requires `hero-mascot-stage`, `hero-trainer-mascot`, `assets/Rino-trener-3d-blue.png`, the accessible phrase `Maskotka Rino w za dużej bordowej czapce z napisem TRENER`, and zero `hero-racket--` occurrences in `dla-trenerow.html`. Also assert that the asset exists.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test test/trainer-subpage.test.js
```

Expected: the new test fails because the page still contains the racket stage and does not reference the mascot asset.

- [ ] **Step 3: Replace only the racket markup**

Use:

```html
<div class="hero-mascot-stage" role="img" aria-label="Maskotka Rino w za dużej bordowej czapce z napisem TRENER">
  <img class="hero-trainer-mascot" src="assets/Rino-trener-3d-blue.png" alt="" aria-hidden="true">
</div>
```

Delete only the existing `.hero-racket-stage` block and its three child images.

- [ ] **Step 4: Add scoped responsive styles**

Add styles next to the current hero styles. Position the stage behind overlay cards, use `object-fit: contain`, a restrained drop shadow, a short transform/opacity entrance, tablet and phone sizes, and a `prefers-reduced-motion: reduce` override. Do not use `transition: all` or introduce a dependency.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test test/trainer-subpage.test.js
```

Expected: all trainer subpage tests pass.

---

### Task 3: Full and visual verification

**Files:**
- Verify: `dla-trenerow.html`
- Verify: `assets/Rino-trener-3d-blue.png`

**Interfaces:**
- Consumes: local server at `http://127.0.0.1:8787/dla-trenerow.html`.
- Produces: verified desktop and mobile trainer hero.

- [ ] **Step 1: Run the full automated suite**

Run `npm test` and require zero failures.

- [ ] **Step 2: Start or reuse the local server**

Run `npm start` and open the trainer landing page.

- [ ] **Step 3: Verify desktop at 1440 × 1000**

Confirm one mascot replaces all rackets, the cap is clearly oversized and burgundy, `TRENER` is legible, the left hand touches the brim, overlay cards remain readable, and there is no horizontal overflow.

- [ ] **Step 4: Verify mobile at 390 × 844**

Confirm text precedes the visual, the mascot fits without important clipping, the cap text remains legible, cards do not obscure the face/hand, and there is no horizontal overflow.

- [ ] **Step 5: Run final repository checks**

Run `npm test`, `git diff --check`, and inspect `git diff -- dla-trenerow.html test/trainer-subpage.test.js`. Require zero test failures and no whitespace errors; ensure all changed lines map to this request.

## Plan self-review

- Spec coverage: asset generation, exact pose/text, oversized cap, targeted markup replacement, accessibility, responsive CSS, alpha validation, tests, and two viewport checks are covered.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation remains.
- Naming consistency: `Rino-trener-3d-blue.png`, `hero-mascot-stage`, and `hero-trainer-mascot` match across the plan, markup, test, and verification steps.
