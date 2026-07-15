const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createWaitlistHandler } = require('../server')

const validLead = {
  name: '  Anna Nowak  ',
  email: ' ANNA@EXAMPLE.COM ',
  discipline: ' Tenis ',
  source: 'homepage',
  consent: true,
  website: ''
}

test('forwards a normalized trainer lead to the configured webhook', async () => {
  const calls = []
  const handler = createWaitlistHandler({
    webhookUrl: 'https://example.test/hook',
    webhookSecret: 'secret-value',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return { ok: true }
    }
  })

  const result = await handler(validLead)

  assert.deepEqual(result, { status: 200, body: { ok: true } })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://example.test/hook')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    secret: 'secret-value',
    name: 'Anna Nowak',
    email: 'anna@example.com',
    discipline: 'Tenis',
    source: 'homepage'
  })
})

test('rejects an invalid trainer lead without calling the webhook', async () => {
  let calls = 0
  const handler = createWaitlistHandler({
    webhookUrl: 'https://example.test/hook',
    webhookSecret: 'secret-value',
    fetchImpl: async () => { calls += 1; return { ok: true } }
  })

  const result = await handler({ ...validLead, email: 'nie-email', consent: false })

  assert.equal(result.status, 422)
  assert.match(result.body.error, /e-mail/i)
  assert.equal(calls, 0)
})

test('silently accepts a honeypot submission without calling the webhook', async () => {
  let calls = 0
  const handler = createWaitlistHandler({
    webhookUrl: 'https://example.test/hook',
    webhookSecret: 'secret-value',
    fetchImpl: async () => { calls += 1; return { ok: true } }
  })

  const result = await handler({ ...validLead, website: 'https://spam.example' })

  assert.deepEqual(result, { status: 200, body: { ok: true } })
  assert.equal(calls, 0)
})

test('reports missing webhook configuration', async () => {
  const handler = createWaitlistHandler({ webhookUrl: '', webhookSecret: '' })

  const result = await handler(validLead)

  assert.equal(result.status, 503)
  assert.match(result.body.error, /spróbuj ponownie/i)
})

test('reports a webhook failure without exposing its response', async () => {
  const handler = createWaitlistHandler({
    webhookUrl: 'https://example.test/hook',
    webhookSecret: 'secret-value',
    fetchImpl: async () => ({ ok: false, status: 500 })
  })

  const result = await handler(validLead)

  assert.equal(result.status, 502)
  assert.match(result.body.error, /spróbuj ponownie/i)
})
