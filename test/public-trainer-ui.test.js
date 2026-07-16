const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'panel.html'), 'utf8')
const css = fs.readFileSync(path.join(root, 'panel.css'), 'utf8')

test('search requires city before district and hides sort initially', () => {
  assert.match(html, /name="city"[\s\S]+value="Warszawa"/)
  assert.match(html, /name="district"[^>]+disabled/)
  assert.match(html, /id="resultControls"[^>]+hidden/)
  assert.match(html, /value="relevance"[\s\S]+value="price-asc"[\s\S]+value="price-desc"[\s\S]+value="rating-desc"[\s\S]+value="reviews-desc"/)
})

test('public trainer profile has gallery, content, reviews and reserve CTA', () => {
  assert.match(html, /data-route="trainer"/)
  for (const id of ['trainerGallery', 'publicTrainerName', 'publicTrainerBio', 'publicTrainerExperience', 'publicTrainerSpecialties', 'trainerReviews', 'profileReserve']) assert.match(html, new RegExp(`id="${id}"`))
})

test('new UI follows current tokens and responsive constraints', () => {
  assert.match(css, /\.filter-segment/)
  assert.match(css, /\.public-profile-layout/)
  assert.match(css, /\.trainer-gallery/)
  assert.match(css, /@media \(max-width: 820px\)[\s\S]+\.public-profile-layout/)
  assert.doesNotMatch(css, /transition:\s*all\b/)
})
