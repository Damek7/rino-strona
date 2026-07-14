const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

test('homepage hero speaks only to clients', () => {
  assert.match(html, /Znajdź trenera, z którym naprawdę zaczniesz\./)
  assert.match(html, /href="panel\.html"[^>]*>Znajdź trenera</)
  assert.match(html, /href="#jak-to-dziala"[^>]*>Zobacz, jak to działa/)
  assert.doesNotMatch(html, /Rekrutujemy trenerów-założycieli/)
  assert.doesNotMatch(html, /Dołącz jako trener/)
})

test('hero uses two decorative edge dots', () => {
  assert.match(html, /href="hero\.css"/)
  assert.equal((html.match(/class="hero-dot hero-dot--/g) || []).length, 2)
  assert.match(html, /hero-dot--pink" aria-hidden="true"/)
  assert.match(html, /hero-dot--blue" aria-hidden="true"/)
})

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

test('hero styles preserve brand colors and mobile behavior', () => {
  const css = fs.readFileSync(path.join(root, 'hero.css'), 'utf8')
  assert.match(css, /#C72562/i)
  assert.match(css, /#A9D4EA/i)
  assert.match(css, /@media\s*\(max-width:\s*920px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
})
