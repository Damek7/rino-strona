const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('trainer landing leads with the trainer value proposition', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.match(html, /<title>RinoMove dla trenerów\. Twój profil pracuje<\/title>/)
  assert.match(html, /class="site-nav liquid-glass-nav public-navigation"/)
  assert.doesNotMatch(html, /class="eyebrow"/)
  assert.match(html, /<h1>Twój profil pracuje\. Ty trenujesz\.<\/h1>/)
  assert.match(html, /href="#kontakt"[^>]*>Zgłoś się jako trener-założyciel</)
  assert.doesNotMatch(html, />Przeglądaj trenerów</)
  assert.match(html, /assets\/Rino-logo-v10\.png/)
  assert.match(html, /assets\/tennis-back-serve\.png/)
})

test('trainer landing uses benefit-led section headings', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  for (const heading of [
    'Nie kolejny katalog. Miejsce zbudowane wokół trenera.',
    'Mniej wiadomości. Więcej jasnych ustaleń.',
    'Od zainteresowania do potwierdzonego terminu.',
    'Dołącz wcześniej. Pomóż ustawić dobry kierunek.',
    'Pokaż nam, jak pracujesz.',
    'Zanim dołączysz.'
  ]) assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

test('trainer landing assets are present in the main project', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'Rino-logo-v10.png')), true)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'tennis-back-serve.png')), true)
})

test('trainer landing uses the mascot and wordmark logo assets', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.equal((html.match(/assets\/Rino-logo-v10\.png/g) || []).length, 2)
  assert.equal((html.match(/assets\/rino-move-wordmark\.png/g) || []).length, 2)
})

test('trainer landing returns to the homepage without rendering the trainer mascot', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.match(html, /href="index\.html#top"/)
  assert.match(html, /href="index\.html#top">Strona główna</)
  assert.match(html, /href="#program">Program</)
  assert.match(html, /aria-label="RinoMove — strona główna"/)
  assert.match(html, /class="hero trainer-home-hero"/)
  assert.doesNotMatch(html, /trainer-mascot-showcase|trainer-lower-mascot/)
  assert.doesNotMatch(html, /assets\/Rino-trener-3d-blue\.png/)
  assert.equal((html.match(/hero-racket--/g) || []).length, 0)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'Rino-trener-3d-blue.png')), true)
})

test('trainer hero places the blue ball below the calendar layer', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  const visualStart = html.indexOf('<div class="hero-visual"')
  const visualEnd = html.indexOf('</div>\n      </div>', visualStart)
  const visual = html.slice(visualStart, visualEnd)

  assert.match(visual, /<span class="hero-dot hero-dot-lime"/)
  assert.equal(visual.indexOf('hero-dot-lime') < visual.indexOf('availability-card'), true)
  assert.match(html, /\.trainer-home-hero \.hero-visual>\.hero-dot-lime\{[^}]*z-index:0;/)
  assert.match(html, /\.trainer-home-hero \.availability-card\{z-index:2;/)
})

test('trainer hero keeps the calendar, rating and profile cards visible above the decorative ball', () => {
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
