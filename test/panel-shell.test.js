const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'panel.html'), 'utf8')
const cssPath = path.join(root, 'panel.css')
const js = fs.readFileSync(path.join(root, 'panel.js'), 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')

test('panel uses a focused stylesheet and modular data scripts', () => {
  assert.match(html, /href="panel\.css"/)
  assert.doesNotMatch(html, /<style>/)
  for (const source of ['/vendor/supabase.js', 'lib/domain.js', 'lib/demo-store.js', 'lib/supabase-store.js', 'lib/app-store.js', 'lib/panel-helpers.js', 'panel.js']) {
    assert.match(html, new RegExp(`src="${source.replace(/[./]/g, '\\$&')}"`))
  }
  assert.equal(fs.existsSync(cssPath), true)
})

test('panel has semantic shell, status feedback and role navigation', () => {
  assert.match(html, /id="appShell"/)
  assert.match(html, /<aside[^>]+class="app-sidebar"/)
  assert.match(html, /<main[^>]+id="content"/)
  assert.match(html, /id="appNav"/)
  assert.match(html, /id="modeBadge"/)
  assert.match(html, /id="liveStatus"[^>]+aria-live="polite"/)
  assert.match(js, /navigationForRole/)
})

test('account dialog supports both roles and demo quick access', () => {
  assert.match(html, /<dialog[^>]+id="authDialog"/)
  assert.match(html, /value="client"/)
  assert.match(html, /value="trainer"/)
  assert.match(html, /data-demo-login="client"/)
  assert.match(html, /data-demo-login="trainer"/)
  assert.match(html, /name="acceptTerms"/)
  assert.match(html, /id="trainerPhotoField"[^>]+hidden/)
  assert.match(html, /name="trainerPhoto"[^>]+type="file"[^>]+accept="image\/jpeg,image\/png,image\/webp"/)
  assert.match(html, /id="trainerPhotoPreview"/)
  assert.match(js, /authMode:\s*'login'/)
  assert.match(js, /accountButton[\s\S]+setAuthMode\('login'\)[\s\S]+openDialog\('authDialog'\)/)
  assert.match(css, /dialog#authDialog::backdrop\s*\{[^}]*background:\s*#fff[^}]*backdrop-filter:\s*none/s)
  assert.match(css, /html\s+\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/)
})

test('navigation icons are SVG and panel is responsive and motion safe', () => {
  assert.match(html, /<symbol id="icon-calendar"/)
  assert.doesNotMatch(html, /class="nav-icon">[^<]+</)
  assert.match(css, /@media\s*\(max-width:\s*820px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.doesNotMatch(css, /transition:\s*all\b/)
  assert.match(css, /min-(?:width|height):\s*40px/)
})

test('trainer secondary routes use a mobile more menu', () => {
  assert.match(html, /id="moreDialog"/)
  assert.match(html, /id="moreNav"/)
  assert.match(js, /nav-secondary/)
  assert.match(js, /Więcej/)
})

test('each route exposes a loading state while its data is fetched', () => {
  assert.match(js, /activeView\.setAttribute\('aria-busy', 'true'\)/)
  assert.match(js, /activeView\.removeAttribute\('aria-busy'\)/)
})

test('navigation and route failures expose accessible local state', () => {
  assert.match(js, /setAttribute\('aria-current', 'page'\)/)
  assert.match(js, /errorState\.classList\.add\('view-error'\)/)
  assert.match(js, /Spróbuj ponownie/)
})
