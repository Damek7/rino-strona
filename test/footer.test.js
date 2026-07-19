const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { decodeRgbaPng, alphaBounds } = require('./png-alpha')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const cssPath = path.join(root, 'footer.css')
const assetPath = path.join(root, 'assets', 'rino-footer-grip-3d.png')
const footerMatch = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)
const footerMarkup = footerMatch?.[0] || ''

test('homepage contains the approved footer content and destinations', () => {
  assert.match(html, /href="footer\.css(?:\?[^\"]*)?"/)
  assert.ok(footerMatch, 'semantic site footer should exist')
  assert.match(footerMarkup, /assets\/rino-footer-grip-3d\.png/)
  assert.match(footerMarkup, /<img src="assets\/rino-footer-grip-3d\.png" alt="" width="1565" height="1005">/)
  assert.match(footerMarkup, /<img class="site-footer__wordmark" src="assets\/rino-move-wordmark\.png" alt="Rino Move">/)
  assert.doesNotMatch(footerMarkup, /<span>RinoMove<\/span>/)

  for (const [href, label] of [
    ['#jak-to-dziala', 'Jak to działa'],
    ['dla-trenerow.html', 'Dla trenerów'],
    ['#faq', 'FAQ'],
    ['regulamin.html', 'Regulamin'],
    ['polityka-prywatnosci.html', 'Polityka prywatności'],
    ['rodo.html', 'RODO'],
    ['cookies.html', 'Cookies'],
  ]) {
    assert.ok(footerMarkup.includes(`href="${href}"`), `${href} destination should exist in the footer`)
    assert.ok(footerMarkup.includes(`>${label}`), `${label} label should exist in the footer`)
  }

  assert.doesNotMatch(footerMarkup, /href="#zapisy"/)
  assert.equal((footerMarkup.match(/data-status="preparation"/g) || []).length, 4)
  assert.match(footerMarkup, /© 2026 RinoMove/)
})

test('footer styling uses a blue-to-navy gradient and snow-white type', () => {
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')

  assert.match(css, /linear-gradient\(180deg,\s*#176fbd\s+0%,\s*#0b3f86\s+48%,\s*#041b46\s+100%\)/i)
  assert.match(css, /\.site-footer,\s*\.site-footer a,\s*\.site-footer h2,\s*\.site-footer p,\s*\.site-footer span,\s*\.site-footer small\s*\{[^}]*color:\s*#fff;/s)
  assert.match(css, /\.site-footer__wordmark\s*\{[^}]*filter:\s*brightness\(0\)\s+invert\(1\)/s)
  assert.match(css, /min-height:\s*40px/)
  assert.match(css, /@media\s*\(max-width:\s*760px\)/)
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.doesNotMatch(css, /transition:\s*all/)
  assert.match(css, /\.site-footer__mascot\s*\{[^}]*width:\s*min\(52vw,\s*725px\)/s)
  assert.doesNotMatch(css, /\.site-footer__mascot\s*\{[^}]*\n\s*\d+\s*\n[^}]*width:/s)
  assert.match(css, /@media\s*\(max-width:\s*920px\)[\s\S]*?\.site-footer__mascot\s*\{\s*width:\s*min\(48vw,\s*430px\)/)
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.site-footer__mascot\s*\{\s*width:\s*min\(96vw,\s*380px\)/)
  assert.match(css, /@media\s*\(max-width:\s*520px\)[\s\S]*?\.site-footer__mascot\s*\{\s*width:\s*min\(96vw,\s*370px\)/)

  const compactCss = css.slice(css.indexOf('@media (max-width: 520px)'), css.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(compactCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/)
  assert.match(compactCss, /\.site-footer__nav a\s*\{[^}]*flex-wrap:\s*wrap/s)
  assert.doesNotMatch(compactCss, /grid-template-columns:\s*1fr\s*;/)
})

test('footer mascot centers its visible hands on the bottom edge at every width', () => {
  assert.equal(fs.existsSync(cssPath), true)
  const css = fs.readFileSync(cssPath, 'utf8')
  const mascotRules = [...css.matchAll(/\.site-footer__mascot\s*\{([^}]*)\}/g)].map((match) => match[1])
  const image = decodeRgbaPng(fs.readFileSync(assetPath))
  const bounds = alphaBounds(image)
  const expectedOffset = ((bounds.bottomPadding / image.height) * 100).toFixed(6)
  const transformMatch = mascotRules[0].match(/transform:\s*translate\(-50%,\s*([0-9.]+)%\)/)

  assert.match(mascotRules[0], /left:\s*50%/)
  assert.match(mascotRules[0], /bottom:\s*0/)
  assert.ok(transformMatch, 'mascot transform must use a percentage offset tied to its rendered height')
  assert.equal(Number(transformMatch[1]).toFixed(6), expectedOffset)
  assert.equal(
    mascotRules.slice(1).some((rule) => /\b(?:bottom|transform)\s*:/.test(rule)),
    false,
    'responsive rules must preserve asset-relative bottom-edge alignment',
  )
})

test('desktop mascot head dome begins at half the footer height', () => {
  const css = fs.readFileSync(cssPath, 'utf8')
  const baseRule = css.match(/\.site-footer__mascot\s*\{([^}]*)\}/)?.[1] || ''
  const width = Number(baseRule.match(/width:\s*min\(52vw,\s*(\d+)px\)/)?.[1])
  const footerHeight = 640
  const assetWidth = 1565
  const headTopRow = 245
  const visibleHandsBottomRow = 936
  const headTop = footerHeight - ((visibleHandsBottomRow - headTopRow) * width / assetWidth)
  const ratio = headTop / footerHeight

  assert.ok(ratio >= 0.49 && ratio <= 0.51, `head begins at ${(ratio * 100).toFixed(2)}%`)
})

test('every public subpage includes the shared footer with homepage destinations', () => {
  const publicSubpages = [
    'cookies.html',
    'polityka-prywatnosci.html',
    'regulamin.html',
    'rodo.html',
    'dla-trenerow.html',
    'panel.html',
  ]

  for (const pageName of publicSubpages) {
    const page = fs.readFileSync(path.join(root, pageName), 'utf8')
    assert.match(page, /href="footer\.css(?:\?[^\"]*)?"/)
    assert.match(page, /<footer class="site-footer"/)
    assert.match(page, /assets\/rino-footer-grip-3d\.png/)
    assert.match(page, /href="index\.html#faq"/)
  }

  const trainerPage = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  assert.equal((trainerPage.match(/<footer\b/g) || []).length, 1)
})

test('legal destinations are neutral UTF-8 placeholder pages', () => {
  const stylesheetPath = path.join(root, 'legal-placeholder.css')
  assert.equal(fs.existsSync(stylesheetPath), true, 'shared legal placeholder stylesheet should exist')

  for (const [file, name] of [
    ['regulamin.html', 'Regulamin'],
    ['polityka-prywatnosci.html', 'Polityka prywatności'],
    ['rodo.html', 'RODO'],
    ['cookies.html', 'Cookies'],
  ]) {
    const filePath = path.join(root, file)
    assert.equal(fs.existsSync(filePath), true, `${file} should exist`)
    let page = fs.readFileSync(filePath, 'utf8')
    const mainMatch = page.match(/<main class="legal-placeholder">([\s\S]*?)<\/main>/)
    const mainMarkup = mainMatch?.[0] || ''

    assert.match(page, /<meta charset="utf-8">/)
    assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1">/)
    assert.match(page, new RegExp(`<title>${name} — RinoMove<\\/title>`))
    assert.ok(mainMatch, `${file} should keep its placeholder main`)
    assert.match(mainMarkup, new RegExp(`<h1>${name}<\\/h1>`))
    assert.match(mainMarkup, /Dokument w przygotowaniu/)
    assert.match(mainMarkup, /Ostateczna wersja dokumentu zostanie opublikowana przed uruchomieniem platformy\./)
    assert.match(mainMarkup, /href="index\.html"/)
    assert.match(page, /href="legal-placeholder\.css"/)
    page = mainMarkup
    assert.doesNotMatch(page, /\b20\d{2}\b|<li>|<section|warunki korzystania|obowiązki użytkownika/i)
  }
})
