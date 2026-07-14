const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const cssPath = path.join(root, 'trainer-section.css')

test('trainer section is light, product-led and has no boxing photo', () => {
  assert.match(html, /href="trainer-section\.css"/)
  assert.match(html, /class="trainer-product"/)
  assert.equal((html.match(/class="trainer-benefit"/g) || []).length, 4)
  assert.doesNotMatch(html, /trainer-boxing-editorial\.png/)
})

test('trainer section preserves both trainer journeys', () => {
  const section = html.slice(html.indexOf('id="dla-trenerow"'), html.indexOf('id="zapisy"'))
  assert.match(section, /href="dla-trenerow\.html"/)
  assert.match(section, /href="#zapisy"/)
  assert.match(section, /Więcej czasu na trening/)
})

test('trainer section is responsive and does not restore a pink full-screen background', () => {
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')
  assert.match(css, /\.trainer-benefit-grid/)
  assert.match(css, /@media\s*\(max-width:\s*820px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.doesNotMatch(css, /background:\s*#c72562/i)
})
