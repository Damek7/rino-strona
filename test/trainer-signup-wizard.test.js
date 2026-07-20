const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { server } = require('../server')

let browser
let baseUrl

before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  if (browser) await browser.close()
  if (server.listening) await new Promise(resolve => server.close(resolve))
})

test('wizard moves forward and back without losing answers', async () => {
  const page = await browser.newPage()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  page.setDefaultTimeout(5000)
  await page.goto(`${baseUrl}/index.html#zapisy`, { waitUntil: 'domcontentloaded' })
  const form = page.locator('[data-trainer-signup]')

  await form.locator('[name="discipline"]').fill('Tenis')
  await form.locator('[name="city"]').fill('Warszawa')
  await form.locator('[name="district"]').fill('Mokotów')
  await form.locator('[name="workModel"][value="independent"]').check()
  await form.locator('[data-signup-next]').click()
  await assert.doesNotReject(() => form.locator('[data-signup-step="2"]').waitFor({ state: 'visible' }))
  await form.locator('[data-signup-back]').click()

  assert.equal(await form.locator('[name="discipline"]').inputValue(), 'Tenis')
  await page.close()
})

test('the second step captures current availability and the main need', async () => {
  const page = await browser.newPage()
  page.setDefaultTimeout(5000)
  await page.goto(`${baseUrl}/index.html#zapisy`, { waitUntil: 'domcontentloaded' })
  const form = page.locator('[data-trainer-signup]')

  await form.locator('[name="discipline"]').fill('Tenis')
  await form.locator('[name="city"]').fill('Warszawa')
  await form.locator('[name="workModel"][value="independent"]').check()
  await form.locator('[data-signup-next]').click()
  await form.locator('[name="acceptingClients"][value="yes"]').check()
  await form.locator('[name="primaryNeed"][value="new_clients"]').check()

  assert.equal(await form.locator('[name="acceptingClients"]:checked').inputValue(), 'yes')
  assert.equal(await form.locator('[name="primaryNeed"]:checked').inputValue(), 'new_clients')
  await page.close()
})

test('qualification forms fit a 390px mobile viewport', async () => {
  for (const path of ['/index.html#zapisy', '/dla-trenerow.html#kontakt']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' })
    await page.locator('[data-trainer-signup]').scrollIntoViewIfNeeded()

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true)
    await assert.doesNotReject(() => page.locator('[data-signup-step="1"]').waitFor({ state: 'visible' }))
    await page.close()
  }
})

test('failed delivery keeps a completed qualification available for retry', async () => {
  const page = await browser.newPage()
  page.setDefaultTimeout(3000)
  await page.goto(`${baseUrl}/index.html#zapisy`, { waitUntil: 'domcontentloaded' })
  const form = page.locator('[data-trainer-signup]')
  const next = form.locator('[data-signup-next]')

  await form.locator('[name="discipline"]').fill('Tenis')
  await form.locator('[name="city"]').fill('Warszawa')
  await form.locator('[name="workModel"][value="independent"]').check()
  await next.click()
  await form.locator('[name="acceptingClients"][value="yes"]').check()
  await form.locator('[name="primaryNeed"][value="new_clients"]').check()
  await form.locator('[name="blocker"]').fill('Za dużo czasu tracę na wiadomości i ręczne ustalanie terminów.')
  await next.click()
  await form.locator('[name="name"]').fill('Jan Trener')
  await form.locator('[name="email"]').fill('jan@example.com')
  await form.locator('[name="consent"]').check()
  await form.locator('[type="submit"]').click()

  await assert.doesNotReject(() => form.locator('[data-signup-status].is-error').waitFor({ state: 'visible' }))
  assert.equal(await form.locator('[name="discipline"]').inputValue(), 'Tenis')
  assert.equal(await form.locator('[name="email"]').inputValue(), 'jan@example.com')
  await page.close()
})
