const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const panelJs = fs.readFileSync(path.join(root, 'panel.js'), 'utf8')
const cssPath = path.join(root, 'cta.css')

test('account entry gives clients and trainers separate paths', () => {
  assert.match(html, /href="cta\.css"/)
  assert.match(html, /id="konto"/)
  assert.equal((html.match(/class="account-path account-path--/g) || []).length, 2)
  assert.match(html, /href="panel\.html#register"/)
  assert.match(html, /href="panel\.html\?role=trainer#register"/)
})

test('trainer path explains certificate verification', () => {
  assert.match(html, /Po utworzeniu konta poprosimy Cię o certyfikaty do weryfikacji\./)
  assert.match(html, /Załóż konto trenera/)
})

test('trainer registration link preselects trainer role', () => {
  assert.match(panelJs, /URLSearchParams\(window\.location\.search\)/)
  assert.match(panelJs, /requestedRole===['"]trainer['"]/)
  assert.match(panelJs, /elements\.role\.value=['"]trainer['"]/)
})

test('account CTA is responsive and reduced-motion safe', () => {
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')
  assert.match(css, /\.account-paths/)
  assert.match(css, /@media\s*\(max-width:\s*700px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
})
