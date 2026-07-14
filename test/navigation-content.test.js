const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const cssPath = path.join(root, 'navigation.css')

test('client navigation exposes the approved destinations', () => {
  assert.match(html, /href="panel\.html"[^>]*>Znajdź trenera</)
  assert.match(html, /href="#jak-to-dziala"[^>]*>Jak to działa</)
  assert.match(html, /href="dla-trenerow\.html"[^>]*>Dla trenerów</)
  assert.match(html, /href="panel\.html#login"[^>]*>Zaloguj się</)
  assert.match(html, /href="panel\.html#register"[^>]*>Załóż konto</)
})

test('navigation loads a focused liquid glass stylesheet', () => {
  assert.match(html, /href="navigation\.css"/)
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')
  assert.match(css, /width:\s*max-content/)
  assert.match(css, /backdrop-filter:\s*blur\(22px\)\s+saturate\(1\.45\)/)
  assert.match(css, /border-radius:\s*999px/)
  assert.match(css, /@supports\s+not\s*\(backdrop-filter:/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
})

test('mobile navigation keeps account creation outside the collapsed menu', () => {
  assert.match(html, /class="btn nav-mobile-cta"[^>]*href="panel\.html#register"/)
  assert.match(html, /aria-controls="main-menu"/)
})
