const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('declares Next.js scripts and a production build script', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  assert.match(pkg.scripts.dev, /^next dev$/)
  assert.match(pkg.scripts.build, /^next build$/)
  assert.match(pkg.scripts.start, /^next start$/)
})

test('keeps the legacy panel and public homepage available to Next', () => {
  assert.equal(fs.existsSync(path.join(root, 'public', 'panel.html')), true)
  assert.equal(fs.existsSync(path.join(root, 'public', 'index.html')), true)
})
