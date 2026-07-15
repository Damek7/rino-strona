const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const journeyCssPath = path.join(root, 'journey.css')

test('homepage follows the approved client-first section order', () => {
  const ids = ['specjalizacje', 'jak-to-dziala', 'zaufanie', 'korzysci', 'dla-trenerow', 'zapisy', 'faq']
  let cursor = -1

  for (const id of ids) {
    const next = html.indexOf(`id="${id}"`, cursor + 1)
    assert.ok(next > cursor, `${id} should follow the approved journey order`)
    cursor = next
  }
})

test('how it works contains three product-backed steps', () => {
  assert.equal((html.match(/class="journey-step journey-step--/g) || []).length, 3)
  assert.equal((html.match(/class="journey-preview journey-preview--/g) || []).length, 3)
  assert.match(html, /Porównaj właściwe osoby/)
  assert.match(html, /Wybierz wolny termin/)
  assert.match(html, /Zapłać i przyjdź na trening/)
})

test('trust proof uses verified platform facts and a client CTA', () => {
  assert.match(html, /id="zaufanie"/)
  assert.match(html, /Profil zweryfikowany/)
  assert.match(html, /Cena widoczna przed rezerwacją/)
  assert.match(html, /Opinia po odbytym treningu/)
  assert.match(html, /href="#zapisy"[^>]*>Zapisz się</)
})

test('journey stylesheet is responsive and motion safe', () => {
  assert.match(html, /href="journey\.css"/)
  assert.equal(fs.existsSync(journeyCssPath), true)
  const css = fs.readFileSync(journeyCssPath, 'utf8')
  assert.match(css, /@media\s*\(max-width:\s*720px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.doesNotMatch(css, /transition:\s*all\b/)
})

test('reveal motion never makes homepage content depend on JavaScript', () => {
  const sports = fs.readFileSync(path.join(root, 'sports.css'), 'utf8')
  const features = fs.readFileSync(path.join(root, 'features.css'), 'utf8')
  assert.doesNotMatch(sports, /\.has-js\s+\.sport-band:not\(\.is-visible\)/)
  assert.doesNotMatch(features, /\.has-js\s+\.feature-card\.reveal:not\(\.is-visible\)/)
  assert.match(html, /classList\.add\('motion-ready'\)/)
})
