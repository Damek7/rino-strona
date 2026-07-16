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
  page.setDefaultTimeout(2000)
  await page.goto(`${baseUrl}/index.html#zapisy`)
  const form = page.locator('[data-trainer-signup]')

  await form.locator('[name="discipline"]').fill('Tenis')
  await form.locator('[name="city"]').fill('Warszawa')
  await form.locator('[name="district"]').fill('Mokotów')
  await form.locator('[data-signup-next]').click()
  await assert.doesNotReject(() => form.locator('[data-signup-step="2"]').waitFor({ state: 'visible' }))
  await form.locator('[data-signup-back]').click()

  assert.equal(await form.locator('[name="discipline"]').inputValue(), 'Tenis')
  await page.close()
})

test('other result reveals and requires the explanation field', async () => {
  const page = await browser.newPage()
  page.setDefaultTimeout(2000)
  await page.goto(`${baseUrl}/index.html#zapisy`)
  const form = page.locator('[data-trainer-signup]')

  await form.locator('[data-signup-step]').evaluateAll(steps => steps.forEach(step => { step.hidden = true }))
  await form.locator('[data-signup-step="7"]').evaluate(step => { step.hidden = false })
  await form.locator('[name="desiredResult"][value="other"]').check()
  await assert.doesNotReject(() => form.locator('[data-other-result]').waitFor({ state: 'visible' }))

  assert.equal(await form.locator('[name="desiredResultOther"]').evaluate(input => input.required), true)
  await page.close()
})

test('qualification forms fit a 390px mobile viewport', async () => {
  for (const path of ['/index.html#zapisy', '/dla-trenerow.html#kontakt']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${baseUrl}${path}`)
    await page.locator('[data-trainer-signup]').scrollIntoViewIfNeeded()

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true)
    await assert.doesNotReject(() => page.locator('[data-signup-step="1"]').waitFor({ state: 'visible' }))
    await page.close()
  }
})

test('failed delivery keeps a completed qualification available for retry', async () => {
  const page = await browser.newPage()
  page.setDefaultTimeout(3000)
  await page.goto(`${baseUrl}/index.html#zapisy`)
  const form = page.locator('[data-trainer-signup]')
  const next = form.locator('[data-signup-next]')

  await form.locator('[name="discipline"]').fill('Tenis')
  await form.locator('[name="city"]').fill('Warszawa')
  await form.locator('[name="district"]').fill('Mokotów')
  await next.click()
  await form.locator('[name="workModel"][value="independent"]').check()
  await next.click()
  await form.locator('[name="capacity"][value="three_to_five"]').check()
  await next.click()
  await form.locator('[name="blocker"]').fill('Za dużo czasu tracę na wiadomości i ręczne ustalanie terminów.')
  await next.click()
  await form.locator('[name="whyNow"]').fill('Mam teraz wolne miejsca i chcę pozyskać nowych klientów.')
  await next.click()
  for (const value of ['profile', 'availability', 'bookings']) {
    await form.locator(`[name="readiness"][value="${value}"]`).check()
  }
  await next.click()
  await form.locator('[name="desiredResult"][value="new_client"]').check()
  await next.click()
  await form.locator('[name="name"]').fill('Jan Trener')
  await form.locator('[name="email"]').fill('jan@example.com')
  await form.locator('[name="phone"]').fill('500600700')
  await form.locator('[name="consent"]').check()
  await form.locator('[type="submit"]').click()

  await assert.doesNotReject(() => form.locator('[data-signup-status].is-error').waitFor({ state: 'visible' }))
  assert.equal(await form.locator('[name="discipline"]').inputValue(), 'Tenis')
  assert.equal(await form.locator('[name="email"]').inputValue(), 'jan@example.com')
  await page.close()
})
