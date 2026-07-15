const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const panelJs = fs.readFileSync(path.join(root, 'panel.js'), 'utf8')
const cssPath = path.join(root, 'cta.css')

test('homepage hides account creation paths before launch', () => {
  assert.match(html, /href="cta\.css"/)
  assert.doesNotMatch(html, /id="konto"|class="account-path/)
  assert.doesNotMatch(html, /panel\.html/)
  assert.match(html, /href="dla-trenerow\.html"/)
})

test('trainer registration link preselects trainer role', () => {
  assert.match(panelJs, /URLSearchParams\(window\.location\.search\)/)
  assert.match(panelJs, /requestedRole===['"]trainer['"]/)
  assert.match(panelJs, /elements\.role\.value=['"]trainer['"]/)
})

test('signup stylesheet remains available for the pre-launch form', () => {
  assert.equal(fs.existsSync(cssPath), true)
})

test('signup form uses one clear pre-launch hierarchy and CTA', () => {
  assert.match(html, /class="signup-kicker">Start wkrótce</)
  assert.match(html, /<h2>Zapisz się jako trener<\/h2>/)
  assert.equal((html.match(/class="seg"/g) || []).length, 0)
  assert.match(html, /id="signup-name"/)
  assert.match(html, /id="signup-email"/)
  assert.match(html, /id="signup-discipline"/)
  assert.match(html, /<button type="submit" class="btn btn-primary btn-block">Zapisz się<\/button>/)
})

test('signup form has responsive, focus and reduced-motion styles', () => {
  const css = fs.readFileSync(cssPath, 'utf8')
  assert.match(css, /\.signup-card:focus-within/)
  assert.match(css, /@media\s*\(max-width:\s*640px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(css, /transition:\s*all\b/)
})
