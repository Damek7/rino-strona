const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

test('homepage hero recruits trainer leads without unsupported promises', () => {
  assert.match(html, /<h1>RinoMove\. Tu trener jest marką\.<\/h1>/)
  assert.match(html, /Budujemy marketplace/)
  assert.match(html, /class="hero-cta"[\s\S]*?href="#zapisy"[^>]*>Zgłoś się jako trener-założyciel</)
  assert.match(html, /href="#jak-to-dziala"[^>]*>Zobacz, jak to działa/)
  assert.doesNotMatch(html, /Znajdź trenera, z którym naprawdę zaczniesz/)
  assert.doesNotMatch(html, /gwarantujemy|gwarantowanych klientów|lider rynku/i)
})

test('homepage adds no sticky or fixed bottom CTA', () => {
  assert.doesNotMatch(html, /bottom-cta|sticky-cta|mobile-cta-bar/)
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

test('mobile and tablet hero content starts below the floating navigation', () => {
  const css = fs.readFileSync(path.join(root, 'hero.css'), 'utf8')

  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?#top\.client-hero \.hero \{[^}]*padding-top: 96px;/
  )
})

test('homepage hero background covers the full viewport height', () => {
  const css = fs.readFileSync(path.join(root, 'hero.css'), 'utf8')

  assert.match(css, /#top\.client-hero\s*\{[^}]*min-height:\s*100dvh;/s)
  assert.match(css, /#top\.client-hero \.hero\s*\{[^}]*min-height:\s*100dvh;/s)
  assert.doesNotMatch(css, /min-height:\s*calc\(100dvh - 82px\)/)
  assert.doesNotMatch(css, /#top\.client-hero,\s*#top\.client-hero \.hero\s*\{[^}]*min-height:\s*auto;/s)
})
