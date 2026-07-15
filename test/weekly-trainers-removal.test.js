const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')

test('homepage does not contain the weekly trainers showcase', () => {
  assert.doesNotMatch(html, /id="trenerzy"/)
  assert.doesNotMatch(html, /Trenerzy w tym tygodniu/)
  assert.doesNotMatch(html, /href="#trenerzy"/)
})

test('trainer discovery remains hidden until the marketplace launches', () => {
  assert.doesNotMatch(html, /panel\.html/)
  assert.equal((html.match(/class="sport-band[^\n]+href="#zapisy"/g) || []).length, 6)
})
