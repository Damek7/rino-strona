const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const pages = [
  'index.html',
  'dla-trenerow.html',
  'panel.html',
  'Home.dc.html',
  'Wybor specjalizacji.dc.html',
]

test('site pages use the Rino logo v10 asset except the approved profile avatar', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'Rino-logo-v10.png')), true)

  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8')

    assert.match(html, /assets\/Rino-logo-v10\.png/)
    if (page === 'index.html') {
      assert.match(html, /<span class="profile-avatar"><img src="assets\/Rino-logo-v9\.png" alt=""><\/span>/)
      assert.equal((html.match(/assets\/Rino-logo(?:-v9)?\.png/g) || []).length, 1)
    } else {
      assert.doesNotMatch(html, /assets\/Rino-logo(?:-v9)?\.png/)
    }
  }
})
