# Mobile Sport Mascot Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the sport-card mascot hover animation on desktop while preventing it from activating after a touch on mobile devices.

**Architecture:** The sport-card image motion is defined in `sports.css` and currently applies to any device that exposes a `:hover` state. Restrict only those image-transform rules to fine-pointer, hover-capable devices; the arrow effect and card links remain unchanged. A content-level Node test guards the media-query boundary.

**Tech Stack:** Static HTML/CSS, Node.js built-in test runner.

## Global Constraints

- Preserve desktop mascot movement for a mouse or trackpad.
- Disable only mascot movement on touch devices.
- Do not change card destinations, layout, or arrow hover styling.

---

### Task 1: Guard sport mascot motion by input capability

**Files:**
- Modify: `C:\Users\damek\Documents\Startup\strona\sports.css:231-237`
- Modify: `C:\Users\damek\Documents\Startup\strona\test\sport-bands.test.js:54-62`

**Interfaces:**
- Consumes: `.sport-band` and `.sport-band--media-right` markup from `index.html`.
- Produces: Image transforms that apply only within `@media (hover: hover) and (pointer: fine)`.

- [ ] **Step 1: Write the failing test**

Append this test to `test/sport-bands.test.js`:

```js
test('sport mascot motion runs only on precise hover devices', () => {
  const css = fs.readFileSync(sportsCssPath, 'utf8')
  const hoverMotion = /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.sport-band:hover\s+\.sport-band-media\s+img\s*\{[\s\S]*?transform:\s*translateX\(8px\)\s+rotate\(1deg\);[\s\S]*?\.sport-band--media-right:hover\s+\.sport-band-media\s+img\s*\{[\s\S]*?transform:\s*translateX\(-8px\)\s+rotate\(-1deg\);/
  assert.match(css, hoverMotion)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/sport-bands.test.js`

Expected: the new test fails because the two mascot movement rules are outside a fine-pointer hover media query.

- [ ] **Step 3: Write the minimal implementation**

Replace the standalone mascot hover rules in `sports.css` with:

```css
@media (hover: hover) and (pointer: fine) {
  .sport-band:hover .sport-band-media img {
    transform: translateX(8px) rotate(1deg);
  }

  .sport-band--media-right:hover .sport-band-media img {
    transform: translateX(-8px) rotate(-1deg);
  }
}
```

Leave `.sport-band:hover .sport-band-arrow` unchanged.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test test/sport-bands.test.js`

Expected: all sport-band tests pass, including the new fine-pointer test.

- [ ] **Step 5: Run the full verification suite**

Run: `npm test`

Expected: all project tests pass.

- [ ] **Step 6: Manually verify both input modes**

Open `http://127.0.0.1:8792/`, navigate to the sport cards, and confirm:

1. A desktop mouse hover still moves the mascot image.
2. A mobile-sized touch interaction does not move or rotate the mascot image.
3. The arrow and navigation destination still work.

- [ ] **Step 7: Commit the implementation**

```bash
git add sports.css test/sport-bands.test.js
git commit -m "fix: prevent sport mascot motion on touch devices"
```
