const { test } = require('node:test')
const assert = require('node:assert/strict')
const { modeFromHash } = require('../auth-route')

test('maps supported account hashes to auth modes', () => {
  assert.equal(modeFromHash('#login'), 'login')
  assert.equal(modeFromHash('#register'), 'register')
})

test('ignores unrelated hashes', () => {
  assert.equal(modeFromHash('#search'), null)
  assert.equal(modeFromHash(''), null)
})
