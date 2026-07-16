const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createWaitlistHandler, qualificationStatus } = require('../server')

const validLead = {
  name: '  Anna Nowak  ',
  email: ' ANNA@EXAMPLE.COM ',
  phone: ' 600 100 200 ',
  profileUrl: ' https://instagram.com/anna.trenuje ',
  discipline: ' Tenis ',
  city: ' Warszawa ',
  district: ' Mokotów ',
  venue: ' Warszawianka ',
  workModel: 'independent',
  capacity: 'three_to_five',
  blocker: ' Tracę dużo czasu na ręczne ustalanie terminów z klientami. ',
  whyNow: ' Mam teraz wolne miejsca i chcę zdobyć nowych klientów. ',
  readiness: ['profile', 'availability', 'bookings', 'feedback'],
  desiredResult: 'new_client',
  desiredResultOther: '',
  source: 'homepage',
  consent: true,
  website: ''
}

test('classifies a ready Warsaw trainer as qualified', () => {
  assert.equal(qualificationStatus(validLead), 'qualified')
})

test('classifies a trainer outside Warsaw as waitlist', () => {
  assert.equal(qualificationStatus({ ...validLead, city: 'Kraków' }), 'waitlist')
})

test('classifies no capacity or missing core readiness as review', () => {
  assert.equal(qualificationStatus({ ...validLead, capacity: 'none' }), 'review')
  assert.equal(qualificationStatus({ ...validLead, readiness: ['profile', 'feedback'] }), 'review')
})

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
    phone: '600 100 200',
    profileUrl: 'https://instagram.com/anna.trenuje',
    discipline: 'Tenis',
    city: 'Warszawa',
    district: 'Mokotów',
    venue: 'Warszawianka',
    workModel: 'independent',
    capacity: 'three_to_five',
    blocker: 'Tracę dużo czasu na ręczne ustalanie terminów z klientami.',
    whyNow: 'Mam teraz wolne miejsca i chcę zdobyć nowych klientów.',
    readiness: ['profile', 'availability', 'bookings', 'feedback'],
    desiredResult: 'new_client',
    desiredResultOther: '',
    qualificationStatus: 'qualified',
    source: 'homepage'
  })
})

for (const [field, value, message] of [
  ['phone', 'abc', /telefon/i],
  ['profileUrl', 'instagram bez adresu', /link/i],
  ['workModel', 'unknown', /model pracy/i],
  ['capacity', 'unknown', /wolnych miejsc/i],
  ['blocker', 'Za krótko', /utrudnia/i],
  ['whyNow', 'Za krótko', /właśnie teraz/i],
  ['readiness', [], /RinoMove/i],
  ['desiredResult', 'other', /rezultat/i],
  ['desiredResultOther', 'x'.repeat(241), /rezultat/i]
]) {
  test(`rejects invalid ${field}`, async () => {
    const handler = createWaitlistHandler({
      webhookUrl: 'https://example.test/hook',
      webhookSecret: 'secret-value',
      fetchImpl: async () => ({ ok: true })
    })

    const result = await handler({ ...validLead, [field]: value })

    assert.equal(result.status, 422)
    assert.match(result.body.error, message)
  })
}

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
