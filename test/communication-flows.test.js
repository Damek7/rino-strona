const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { cleanMessage, preferencePayload } = require('../lib/panel-helpers')

test('message input is trimmed, bounded and never accepts empty content', () => {
  assert.equal(cleanMessage('  Do zobaczenia!  '), 'Do zobaczenia!')
  assert.throws(() => cleanMessage('   '), /pusta/)
  assert.throws(() => cleanMessage('x'.repeat(2001)), /2000/)
})

test('preference payload reads explicit booleans only', () => {
  assert.deepEqual(preferencePayload({ email: true, sms: 0, push: false, before24h: 1, before2h: true, afterTraining: null }), {
    email: true, sms: false, push: false, before24h: true, before2h: true, afterTraining: false,
  })
})

test('panel uses textContent for message bodies and persists communication settings', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'panel.js'), 'utf8')
  assert.match(js, /messageBody\.textContent\s*=/)
  assert.doesNotMatch(js, /messageBody\.innerHTML\s*=/)
  assert.match(js, /store\.sendMessage/)
  assert.match(js, /store\.savePreferences/)
  assert.match(js, /preferencesForm'\)\.addEventListener\('submit'/)
  assert.match(js, /store\.createReview/)
})
