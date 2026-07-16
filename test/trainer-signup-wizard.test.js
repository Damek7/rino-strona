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
