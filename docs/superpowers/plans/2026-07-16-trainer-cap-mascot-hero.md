# Trainer Cap Mascot Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tennis mascot in the client discovery hero with the existing oversized-cap Rino, removing only the word “TRENER” from the cap.

**Architecture:** Produce a new non-destructive transparent PNG derived from `assets/Rino-trener-3d-blue.png`, then point the existing `.heading-rino` image at that asset. Preserve the current hero structure and adjust only the existing responsive image rules if visual inspection proves necessary.

**Tech Stack:** PNG asset editing with built-in image generation, HTML, CSS, Node.js test runner, Playwright.

## Global Constraints

- Keep the same mascot, pose, expression, proportions, lighting, burgundy cap, seams and material.
- Remove only the white word “TRENER”; add no replacement text, logo or object.
- Preserve a transparent background and clean antialiased edges.
- Keep the original `assets/Rino-trener-3d-blue.png` unchanged.
- Do not obscure hero copy or introduce horizontal overflow at 390 px.

---

### Task 1: Create and integrate the plain-cap mascot

**Files:**
- Create: `assets/Rino-trener-cap-plain-3d-blue.png`
- Modify: `panel.html:69`
- Modify if visual QA requires it: `panel.css:110,398`
- Test: `test/public-trainer-ui.test.js`

**Interfaces:**
- Consumes: the existing transparent `assets/Rino-trener-3d-blue.png` and the `.heading-rino` hero slot.
- Produces: a transparent PNG used only by the discovery hero.

- [ ] **Step 1: Write the failing asset-contract test**

Add this test to `test/public-trainer-ui.test.js`:

```js
test('discovery hero uses the plain oversized-cap mascot', () => {
  assert.match(html, /class="heading-rino"[^>]+src="assets\/Rino-trener-cap-plain-3d-blue\.png"/)
  assert.match(html, /class="heading-rino"[^>]+alt="Rino z dużą bordową czapką"/)
  assert.ok(fs.existsSync(path.join(root, 'assets', 'Rino-trener-cap-plain-3d-blue.png')))
})
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```powershell
node --test test/public-trainer-ui.test.js
```

Expected: the new test fails because the hero still references `Rino-tenis-3d-blue.png` and the new PNG does not exist.

- [ ] **Step 3: Create the edited transparent asset**

Use `assets/Rino-trener-3d-blue.png` as the edit target with this precise edit instruction:

```text
Use case: precise-object-edit
Asset type: transparent website hero mascot
Primary request: remove only the white word “TRENER” from the front of the oversized burgundy cap and naturally reconstruct the red fabric underneath.
Constraints: preserve the exact mascot identity, pose, expression, body, hand, cap shape, brim, seams, burgundy color, 3D fabric texture, lighting, shadows, framing and transparent background; add no text, logo, symbol or new object; keep clean antialiased transparent edges.
Avoid: changing the face, body proportions, hand position, cap size, color, crop, background or lighting.
```

Save the selected production result as `assets/Rino-trener-cap-plain-3d-blue.png`. Inspect it at original resolution and verify alpha transparency, transparent corners and the absence of visible lettering or fill artifacts.

- [ ] **Step 4: Point the existing hero image at the new asset**

Replace the existing image in `panel.html` with:

```html
<img class="heading-rino" src="assets/Rino-trener-cap-plain-3d-blue.png" alt="Rino z dużą bordową czapką">
```

Do not change the hero copy, form or DOM hierarchy.

- [ ] **Step 5: Run the focused test and verify the green state**

Run:

```powershell
node --test test/public-trainer-ui.test.js
```

Expected: all tests in the file pass.

- [ ] **Step 6: Verify desktop and mobile rendering**

Start the app, open `panel.html` at 1440 × 1000 and 390 × 844, and inspect the hero. The mascot must show the plain oversized cap, remain within the blue card, leave the heading legible and keep `document.documentElement.scrollWidth === document.documentElement.clientWidth` at 390 px.

If the larger cap needs adjustment, change only `.heading-rino` width/right/bottom values in the existing desktop rule and the `max-width: 820px` rule. Re-run the two viewport checks after every CSS change.

- [ ] **Step 7: Run the full regression suite**

Run:

```powershell
npm test
git diff --check
```

Expected: the complete test suite passes and `git diff --check` reports no errors.

- [ ] **Step 8: Commit the implementation**

```powershell
git add assets/Rino-trener-cap-plain-3d-blue.png panel.html panel.css test/public-trainer-ui.test.js
git commit -m "feat: use plain cap mascot in client hero"
```
