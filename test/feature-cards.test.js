const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const cssPath = path.join(root, 'features.css')

test('client benefits sit after trust proof and before the trainer route', () => {
  const trust = html.indexOf('id="zaufanie"')
  const benefits = html.indexOf('id="korzysci"')
  const trainers = html.indexOf('id="dla-trenerow"')
  assert.ok(trust >= 0, 'trust proof should exist')
  assert.ok(trust < benefits && benefits < trainers)
  assert.match(html, /href="features\.css"/)
})

test('benefits communicate four approved product advantages', () => {
  assert.equal((html.match(/class="feature-card feature-card--/g) || []).length, 4)
  assert.match(html, /Sprawdzone profile/)
  assert.match(html, /Terminy bez telefonu/)
  assert.match(html, /Jasna cena przed rezerwacją/)
  assert.match(html, /Cały trening pod ręką/)
  assert.match(html, /certyfikaty, doświadczenie i opinie/i)
  assert.match(html, /wiadomości, płatność i szczegóły spotkania/i)
})

test('feature cards are responsive and reduced-motion safe', () => {
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')
  assert.match(css, /\.feature-grid/)
  assert.match(css, /\.motion-ready\s+\.feature-card\.reveal:not\(\.is-visible\)/)
  assert.match(css, /@media\s*\(max-width:\s*700px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
})
