const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

function readPage(name) {
  return fs.readFileSync(path.join(root, name), 'utf8')
}

function assertNavigationShell(html) {
  assert.match(html, /<body class="public-subpage">/)
  assert.match(html, /href="navigation\.css"/)
  assert.match(html, /class="site-nav liquid-glass-nav[^\"]*"/)
  assert.match(html, /href="index\.html#top"[^>]*aria-label="RinoMove — strona główna"/)
}

test('trainer landing uses contextual section navigation', () => {
  const html = readPage('dla-trenerow.html')
  assertNavigationShell(html)
  assert.match(html, /class="site-nav liquid-glass-nav public-navigation"/)
  assert.match(html, /href="index\.html#top">Strona główna</)
  assert.match(html, /href="#korzysci">Korzyści</)
  assert.match(html, /href="#program">Program</)
  assert.match(html, /href="#jak">Jak dołączyć</)
  assert.match(html, /class="btn btn-primary nav-register" href="#kontakt">Zgłoś się</)
  assert.match(html, /class="btn nav-mobile-cta" href="#kontakt">Zgłoś się</)
  assert.match(html, /aria-expanded="false"[^>]*aria-controls="main-menu"/)
  assert.match(html, /src="public-navigation\.js"/)
  assert.doesNotMatch(html, />Jak to działa<|>Dla trenerów</)
})

const legalPages = [
  'cookies.html',
  'polityka-prywatnosci.html',
  'regulamin.html',
  'rodo.html',
]

for (const page of legalPages) {
  test(`${page} uses a minimal home-return navigation`, () => {
    const html = readPage(page)
    assertNavigationShell(html)
    assert.match(html, /class="site-nav liquid-glass-nav legal-navigation"/)
    assert.match(html, /class="btn nav-register legal-home-link" href="index\.html#top">Wróć na stronę główną</)
    assert.doesNotMatch(html, /id="main-menu"|nav-mobile-cta|mobile-menu-button/)
    assert.doesNotMatch(html, /src="public-navigation\.js"/)
    assert.doesNotMatch(html, />Jak to działa<|>Dla trenerów<|>Zapisz się</)
  })
}

test('legal layout keeps the document card below the shared navigation', () => {
  const css = fs.readFileSync(path.join(root, 'legal-placeholder.css'), 'utf8')
  assert.match(css, /body\.public-subpage\s*\{[^}]*display:\s*block;[^}]*padding:\s*0 24px 24px;/s)
  assert.match(css, /\.public-subpage \.legal-placeholder\s*\{[^}]*margin:\s*24px auto 0;/s)
})
