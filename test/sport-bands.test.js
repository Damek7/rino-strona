const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const sportsCssPath = path.join(root, 'sports.css')

test('sport choice contains two screens and six bands in the approved order', () => {
  assert.match(html, /href="sports\.css"/)
  assert.equal((html.match(/class="sport-screen"/g) || []).length, 2)
  assert.equal((html.match(/class="sport-band sport-band--/g) || []).length, 6)

  const order = ['Tenis', 'Padel', 'Squash', 'Golf', 'Pływanie', 'Boks']
  let cursor = -1
  for (const sport of order) {
    const next = html.indexOf(`>${sport}</strong>`, cursor + 1)
    assert.ok(next > cursor, `${sport} should appear in the approved order`)
    cursor = next
  }
})

test('sport bands contain approved copy and destinations', () => {
  assert.match(html, /Pokaż specjalizację, poziomy zaawansowania i miejsca treningów\./)
  assert.match(html, /Daj się znaleźć osobom, które szukają indywidualnego prowadzenia\./)
  assert.match(html, /Zbierz ofertę, dostępność i doświadczenie w jednym profilu\./)
  assert.match(html, /Przedstaw metodykę i ofertę, zanim klient napisze pierwszą wiadomość\./)
  assert.match(html, /Ułatw klientowi wybór trenera dla siebie lub dziecka\./)
  assert.match(html, /Pokaż komu pomagasz, gdzie trenujesz i kiedy masz wolne miejsce\./)
  assert.equal((html.match(/class="sport-band-badge">Wkrótce</g) || []).length, 2)
  assert.equal((html.match(/class="sport-band[^\n]+href="#zapisy"/g) || []).length, 6)
  assert.doesNotMatch(html, /class="sport-band[^\n]+href="panel\.html"/)
})

test('sport choice uses all required Rino assets', () => {
  for (const asset of [
    'Rino-tenis-serve-3d-blue.png',
    'Rino-padel-3d-blue.png',
    'Rino-squash-3d-blue.png',
    'Rino-golf-3d-blue.png',
    'Rino-plywanie-3d-blue.png',
    'Rino-boks-3d-blue.png',
  ]) {
    assert.equal(fs.existsSync(path.join(root, 'assets', asset)), true)
    assert.match(html, new RegExp(`assets/${asset.replace('.', '\\.')}"`))
  }
})

test('sport motion is progressive, accessible and reduced-motion safe', () => {
  assert.equal(fs.existsSync(sportsCssPath), true)
  const css = fs.readFileSync(sportsCssPath, 'utf8')
  assert.match(css, /\.motion-ready\s+\.sport-band:not\(\.is-visible\)/)
  assert.match(css, /clip-path:/)
  assert.match(css, /\.sport-band:focus-visible/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
})

test('sport mascot motion runs only on precise hover devices', () => {
  const css = fs.readFileSync(sportsCssPath, 'utf8')
  const hoverMotion = /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.sport-band:hover\s+\.sport-band-media\s+img\s*\{[\s\S]*?transform:\s*translateX\(8px\)\s+rotate\(1deg\);[\s\S]*?\.sport-band--media-right:hover\s+\.sport-band-media\s+img\s*\{[\s\S]*?transform:\s*translateX\(-8px\)\s+rotate\(-1deg\);/
  assert.match(css, hoverMotion)
})

test('navigation displays the supplied Rino Move wordmark beside the mascot', () => {
  assert.match(html, /class="site-wordmark"\s+src="assets\/rino-move-wordmark\.png"/)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'rino-move-wordmark.png')), true)
})
