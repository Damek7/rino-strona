const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { modeFromHash } = require('../auth-route')

test('maps supported account hashes to auth modes', () => {
  assert.equal(modeFromHash('#login'), 'login')
  assert.equal(modeFromHash('#register'), 'register')
})

test('ignores unrelated hashes', () => {
  assert.equal(modeFromHash('#search'), null)
  assert.equal(modeFromHash(''), null)
})

test('login mode can hide registration-only terms', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'panel.html'), 'utf8')
  assert.doesNotMatch(html, /\.check\{display:flex!important/)
})
