const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

function readPage(name) {
  return fs.readFileSync(path.join(root, name), 'utf8')
}

function assertSharedNavigation(html) {
  assert.match(html, /<body class="public-subpage">/)
  assert.match(html, /href="navigation\.css"/)
  assert.match(html, /class="site-nav liquid-glass-nav public-navigation"/)
  assert.match(html, /href="index\.html#top"[^>]*aria-label="RinoMove — strona główna"/)
  assert.match(html, /href="index\.html#jak-to-dziala"[^>]*>Jak to działa</)
  assert.match(html, /href="dla-trenerow\.html"[^>]*>Dla trenerów</)
  assert.match(html, /class="btn btn-primary nav-register" href="index\.html#zapisy">Zapisz się</)
  assert.match(html, /class="btn nav-mobile-cta" href="index\.html#zapisy">Zapisz się</)
  assert.match(html, /aria-expanded="false"[^>]*aria-controls="main-menu"/)
  assert.match(html, /src="public-navigation\.js"/)
}

test('trainer landing uses the homepage navigation with current-page semantics', () => {
  const html = readPage('dla-trenerow.html')
  assertSharedNavigation(html)
  assert.match(html, /href="dla-trenerow\.html" aria-current="page">Dla trenerów</)
  assert.doesNotMatch(html, /class="mobile-menu-toggle"/)
})

const legalPages = [
  'cookies.html',
  'polityka-prywatnosci.html',
  'regulamin.html',
  'rodo.html',
]

for (const page of legalPages) {
  test(`${page} uses the homepage navigation`, () => {
    const html = readPage(page)
    assertSharedNavigation(html)
    assert.doesNotMatch(html, /aria-current="page"/)
  })
}

test('legal layout keeps the document card below the shared navigation', () => {
  const css = fs.readFileSync(path.join(root, 'legal-placeholder.css'), 'utf8')
  assert.match(css, /body\.public-subpage\s*\{[^}]*display:\s*block;[^}]*padding:\s*0 24px 24px;/s)
  assert.match(css, /\.public-subpage \.legal-placeholder\s*\{[^}]*margin:\s*24px auto 0;/s)
})
