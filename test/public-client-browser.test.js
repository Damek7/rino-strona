const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { server } = require('../server')

let origin
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
})
after(async () => { await new Promise(resolve => server.close(resolve)) })

test('anonymous user searches, reads profile and authenticates only on reserve', async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${origin}/panel.html`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('#searchForm')
  assert.equal(await page.locator('#district').isDisabled(), true)
  assert.equal(await page.locator('#resultControls').isHidden(), true)
  await page.selectOption('#city', 'Warszawa')
  assert.equal(await page.locator('#district').isEnabled(), true)
  await page.selectOption('#discipline', 'tenis')
  await page.fill('#searchQuery', 'Marek')
  await page.click('#searchForm button[type="submit"]')
  await page.waitForSelector('.trainer-card')
  assert.equal(await page.locator('#resultControls').isVisible(), true)
  await page.selectOption('#trainerSort', 'reviews-desc')
  await page.getByRole('button', { name: 'Zobacz profil' }).first().click()
  await page.waitForSelector('#publicTrainerProfile.is-active')
  assert.match(await page.locator('#publicTrainerBio').textContent(), /trener/i)
  assert.ok(await page.locator('#trainerReviews .review-card').count() >= 2)
  assert.equal(await page.locator('#authDialog').evaluate(node => node.open), false)
  await page.evaluate(() => { window.location.hash = '#trainer/nieistniejacy-trener' })
  await page.waitForFunction(() => document.querySelector('#publicTrainerName').textContent === 'Profil niedostępny')
  assert.doesNotMatch(await page.locator('#publicTrainerBio').textContent(), /Marek Kowalski/)
  await page.evaluate(() => { window.location.hash = '#trainer/trainer-marek' })
  await page.waitForFunction(() => document.querySelector('#publicTrainerName').textContent === 'Marek Kowalski')
  await page.click('#profileReserve')
  assert.equal(await page.locator('#authDialog').evaluate(node => node.open), true)
  assert.equal(await page.locator('#roleField').isHidden(), true)
  await page.getByRole('button', { name: 'Konto klienta' }).click()
  await page.waitForSelector('[data-route="calendar"].is-active')
  assert.match(await page.locator('#calendarTitle').textContent(), /Marek Kowalski/)
  await page.locator('.slot-button:not([disabled])').first().click()
  assert.equal(await page.locator('#bookingDialog').evaluate(node => node.open), true)
  await page.click('#confirmBooking')
  await page.waitForSelector('[data-route="bookings"].is-active')
  assert.match(await page.locator('#bookingList').textContent(), /Marek Kowalski/)
  await browser.close()
})

test('mobile discovery hero keeps the cap mascot clear of copy', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${origin}/panel.html`)
    await page.waitForSelector('.heading-rino')
    const layout = await page.evaluate(() => {
      const image = document.querySelector('.heading-rino').getBoundingClientRect()
      const copy = document.querySelector('.page-heading--accent p').getBoundingClientRect()
      return {
        imageLeft: image.left,
        copyRight: copy.right,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }
    })
    assert.ok(layout.imageLeft >= layout.copyRight)
    assert.equal(layout.scrollWidth, layout.clientWidth)
  } finally {
    await browser.close()
  }
})
