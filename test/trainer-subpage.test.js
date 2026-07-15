const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('trainer landing is available as a local subpage', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.match(html, /RinoMove dla/)
  assert.match(html, /class="site-nav"/)
  assert.match(html, /Bez wiadomo/)
  assert.match(html, /Trener i terminy/)
  assert.match(html, /assets\/rino-logo\.png/)
  assert.match(html, /assets\/tennis-back-serve\.png/)
})

test('trainer landing assets are present in the main project', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'rino-logo.png')), true)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'tennis-back-serve.png')), true)
})

test('trainer landing uses the mascot and wordmark logo assets', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.equal((html.match(/assets\/Rino-logo-v9\.png/g) || []).length, 2)
  assert.equal((html.match(/assets\/rino-move-wordmark\.png/g) || []).length, 2)
})

test('trainer landing returns to the homepage and uses the trainer mascot below hero', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.equal((html.match(/href="index\.html"/g) || []).length >= 3, true)
  assert.match(html, /Wróć na stronę główną/)
  assert.match(html, /class="hero trainer-home-hero"/)
  assert.match(html, /class="trainer-mascot-showcase"/)
  assert.match(html, /class="trainer-lower-mascot"/)
  assert.match(html, /assets\/Rino-trener-3d-blue\.png/)
  assert.match(html, /Maskotka Rino w za dużej bordowej czapce z napisem TRENER/)
  assert.equal((html.match(/hero-racket--/g) || []).length, 0)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'Rino-trener-3d-blue.png')), true)
})

test('trainer mascot is outside hero and inside the manifesto section', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  const heroStart = html.indexOf('<header class="hero trainer-home-hero"')
  const heroEnd = html.indexOf('</header>', heroStart) + '</header>'.length
  const manifestoStart = html.indexOf('<section class="manifesto"')
  const manifestoEnd = html.indexOf('</section>', manifestoStart) + '</section>'.length
  const hero = html.slice(heroStart, heroEnd)
  const manifesto = html.slice(manifestoStart, manifestoEnd)

  assert.doesNotMatch(hero, /Rino-trener-3d-blue\.png|hero-mascot-stage|hero-trainer-mascot/)
  assert.match(manifesto, /class="wrap manifesto-layout"/)
  assert.match(manifesto, /class="trainer-mascot-showcase"/)
  assert.match(manifesto, /class="trainer-lower-mascot"/)
  assert.match(manifesto, /assets\/Rino-trener-3d-blue\.png/)
  assert.equal((html.match(/assets\/Rino-trener-3d-blue\.png/g) || []).length, 1)
})

test('trainer hero keeps the calendar, rating and profile cards visible above the mascot', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.match(html, /class="availability-card"/)
  assert.match(html, /class="rating-card"/)
  assert.match(html, /class="trainer-card"/)
  assert.doesNotMatch(
    html,
    /\.trainer-home-hero \.availability-card,\.trainer-home-hero \.rating-card,\.trainer-home-hero \.trainer-card\{display:none\}/
  )
})

test('trainer hero compacts the card-only visual without changing the mobile card position', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.match(html, /\.trainer-home-hero \.hero-visual\{align-self:center;min-height:520px\}/)
  assert.match(html, /\.trainer-home-hero \.availability-card\{z-index:2;inset:78px 24px auto 0;/)
  assert.match(html, /\.trainer-home-hero \.trainer-card\{top:400px;bottom:auto\}/)
  assert.match(html, /\.trainer-home-hero \.hero-visual\{min-height:500px\}/)
  assert.match(html, /\.trainer-home-hero \.availability-card\{inset:60px 0 auto 0\}/)
  assert.match(html, /\.trainer-home-hero \.trainer-card\{top:382px\}/)
  assert.match(html, /\.trainer-home-hero \.trainer-card\{top:auto;bottom:0\}/)
  assert.match(html, /\.trainer-home-hero \.hero-visual\{min-height:410px\}/)
})
