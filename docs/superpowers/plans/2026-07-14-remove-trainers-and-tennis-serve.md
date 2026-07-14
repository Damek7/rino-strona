# Remove Trainers And Tennis Serve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the weekly-trainer showcase and replace the tennis mascot with a distinct blue 3D serving pose.

**Architecture:** Delete the isolated trainer-list section and route its entry points directly to the existing panel. Generate one new transparent tennis asset and swap only the tennis sport-band reference.

**Tech Stack:** HTML, Node test runner, GPT Image built-in generation, chroma-key removal helper.

## Global Constraints

- Tennis pose is an overhead serve with ball toss and raised racket.
- Rino remains `#A9D4EA`, full 3D and transparent.
- `#trenerzy` is removed and active search links use `panel.html`.

---

### Task 1: Regression tests

**Files:**
- Modify: `test/client-hero.test.js`
- Modify: `test/feature-cards.test.js`
- Modify: `test/sport-bands.test.js`
- Create: `test/weekly-trainers-removal.test.js`

- [ ] Change hero and active sport destinations to `panel.html`, require `Rino-tenis-serve-3d-blue.png`, and assert that `#trenerzy` and its heading are absent.
- [ ] Run `node --test test/client-hero.test.js test/feature-cards.test.js test/sport-bands.test.js test/weekly-trainers-removal.test.js` and verify failure for the existing markup.

### Task 2: Tennis serve asset

**Files:**
- Create: `assets/Rino-tenis-serve-3d-blue.png`
- Modify: `index.html`

- [ ] Generate one blue 3D Rino performing an overhead tennis serve on a flat `#ff00ff` chroma background, using the logo, current tennis Rino and squash Rino as identity and material references.
- [ ] Remove chroma with the installed helper and verify RGBA mode, transparent corners and full silhouette.
- [ ] Replace the tennis image reference.

### Task 3: Remove weekly trainers

**Files:**
- Modify: `index.html`

- [ ] Remove the complete `#trenerzy` section.
- [ ] Route the hero, tennis, padel, golf and boxing links to `panel.html`.
- [ ] Run the focused tests and then `npm test`.
- [ ] Verify desktop and mobile renders and ensure `scrollWidth <= viewport width`.

