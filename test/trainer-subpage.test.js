const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('trainer landing is available as a local subpage', () => {
  const html = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')
  assert.match(html, /<title>RinoMove dla trenerów<\/title>/)
  assert.match(html, /href="index\.html"/)
  assert.match(html, /assets\/trainer-landing-rino-logo\.png/)
  assert.match(html, /assets\/trainer-landing-tennis-back-serve\.png/)
})

test('trainer landing assets are present', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'trainer-landing-rino-logo.png')), true)
  assert.equal(fs.existsSync(path.join(root, 'assets', 'trainer-landing-tennis-back-serve.png')), true)
})
