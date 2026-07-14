const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('trainer landing is available as a local subpage', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

  assert.match(html, /RinoMove dla/)
  assert.match(html, /class="site-nav"/)
  assert.match(html, /Bez wiadomo/)
  assert.match(html, /Trener i terminy/)
  assert.match(html, /assets\/rino-logo\.png/)
  assert.match(html, /assets\/tennis-back-serve\.png/)
})

test('trainer landing assets are present in the main project', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'rino-logo.png')), true)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'tennis-back-serve.png')), true)
})
