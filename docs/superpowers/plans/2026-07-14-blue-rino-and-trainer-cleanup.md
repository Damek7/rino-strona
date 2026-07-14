# Blue Rino And Trainer Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six sport mascots with one blue 3D Rino family and rebuild the pink trainer section as a light ClickUp-inspired product section without the boxing photo.

**Architecture:** Generate project-bound transparent PNG assets as a separate asset layer, then switch existing sport-band references without changing their layout or motion. Rebuild only `#dla-trenerow` markup and isolate its visual rules in a focused stylesheet so the rest of the landing page remains unchanged.

**Tech Stack:** HTML, CSS, Node test runner, GPT Image built-in generation, Pillow/chroma-key helper.

## Global Constraints

- Rino body base is approximately `#A9D4EA` with soft 3D highlights and cool blue shadows.
- Keep black glossy eyes and smile and natural sport-equipment colors.
- Output six transparent PNG files with complete silhouettes and no text.
- Remove `trainer-boxing-editorial.png` from the homepage.
- Replace the full pink trainer-section background with a light neutral product layout.
- Keep the approved hero, sport-band layout, copy and motion unchanged.

---

### Task 1: Blue 3D Rino asset family

**Files:**
- Create: `assets/Rino-tenis-3d-blue.png`
- Create: `assets/Rino-padel-3d-blue.png`
- Create: `assets/Rino-squash-3d-blue.png`
- Create: `assets/Rino-golf-3d-blue.png`
- Create: `assets/Rino-plywanie-3d-blue.png`
- Create: `assets/Rino-boks-3d-blue.png`
- Modify: `index.html`
- Modify: `test/sport-bands.test.js`

**Interfaces:**
- Consumes: the six existing sport-band image positions and the approved logo color reference.
- Produces: six alpha PNG files referenced by the existing `<img class="sport-band-mascot">` elements.

- [ ] **Step 1: Update the sport asset test to require the six blue filenames**

```js
for (const file of [
  'Rino-tenis-3d-blue.png', 'Rino-padel-3d-blue.png',
  'Rino-squash-3d-blue.png', 'Rino-golf-3d-blue.png',
  'Rino-plywanie-3d-blue.png', 'Rino-boks-3d-blue.png'
]) {
  assert.match(html, new RegExp(`assets/${file.replace('.', '\\.')}`))
  assert.equal(fs.existsSync(path.join(root, 'assets', file)), true)
}
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test test/sport-bands.test.js`

Expected: FAIL because the blue asset references and files do not exist.

- [ ] **Step 3: Generate one blue 3D image per sport**

Use the logo image as the identity and color reference, the relevant current sport image as the pose/equipment reference, and the squash image as the 3D material reference. Generate each subject on a flat `#ff00ff` chroma-key background with this invariant prompt:

```text
Use case: stylized-concept. Asset type: transparent website mascot cutout.
Create the same Rino mascot as the identity reference performing the one requested sport in the pose and with the equipment shown in that sport's reference. Make six separate calls in this exact order: tennis, padel, squash, golf, swimming and boxing. Full soft rounded 3D render matching the squash reference. Body color is the logo's light blue, base approximately #A9D4EA, with soft highlights and cool blue shadows. Keep two antennae, black glossy oval eyes and a small black smile. Natural realistic equipment colors. Full silhouette and equipment visible with generous padding. No clothes unless inherent to the sport, no text, no logo, no extra character.
Perfectly flat solid #ff00ff chroma-key background with no shadow, gradient, texture, floor, reflection or lighting variation. Do not use #ff00ff in the subject.
```

- [ ] **Step 4: Remove chroma key and validate alpha**

Run the installed `remove_chroma_key.py` helper for each source with `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`. Validate RGBA mode, transparent corners and non-empty subject coverage with Pillow.

- [ ] **Step 5: Replace the six image references and rerun the focused test**

Run: `node --test test/sport-bands.test.js`

Expected: all sport-band tests PASS.

### Task 2: ClickUp-inspired trainer section

**Files:**
- Create: `trainer-section.css`
- Modify: `index.html`
- Create: `test/trainer-section.test.js`

**Interfaces:**
- Consumes: `#dla-trenerow`, the existing `perks` data and trainer destination links.
- Produces: a light responsive `.trainer-product` section with `.trainer-benefit-grid` and no photography.

- [ ] **Step 1: Write a failing structure test**

```js
test('trainer section is light, product-led and has no boxing photo', () => {
  assert.match(html, /href="trainer-section\.css"/)
  assert.match(html, /class="trainer-product"/)
  assert.equal((html.match(/class="trainer-benefit"/g) || []).length, 4)
  assert.doesNotMatch(html, /trainer-boxing-editorial\.png/)
  assert.match(html, /href="dla-trenerow\.html"/)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test test/trainer-section.test.js`

Expected: FAIL because the new section structure and stylesheet do not exist.

- [ ] **Step 3: Replace only the trainer-section markup**

Use a light two-column section: editorial heading and actions on the left, four numbered benefit cards on the right. Remove `.coaches-media` and its image. Preserve the founder-program copy and links to `dla-trenerow.html` and `#zapisy`.

- [ ] **Step 4: Add focused responsive styles**

Use `#fcfbfc` background, `#17161b` text, white benefit cards, subtle shadows, large balanced heading, raspberry only for eyebrow/numbers, exact-property transitions, `:active { transform: scale(.96) }`, a single-column breakpoint at 820px and reduced-motion rules.

- [ ] **Step 5: Run the focused test**

Run: `node --test test/trainer-section.test.js`

Expected: PASS.

### Task 3: Integrated verification

**Files:**
- Verify: `index.html`
- Verify: `sports.css`
- Verify: `trainer-section.css`
- Verify: `assets/Rino-*-3d-blue.png`

**Interfaces:**
- Consumes: outputs from Tasks 1 and 2.
- Produces: a verified landing page at desktop and mobile sizes.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run static integrity checks**

Run: `git diff --check` and verify every local asset referenced by `index.html` exists.

Expected: no whitespace errors and no missing assets.

- [ ] **Step 3: Inspect desktop and mobile renders**

Check `1440x1000` and `390x844`: all mascots are blue 3D cutouts, the trainer section has no pink full-screen background or boxing photo, headings wrap cleanly and `scrollWidth <= viewport width`.
