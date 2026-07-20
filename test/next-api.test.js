const { test } = require('node:test')
const assert = require('node:assert/strict')
const { GET: health } = require('../app/api/health/route')
const { GET: config } = require('../app/api/config/route')
const { GET: trainers } = require('../app/api/trainers/route')

test('health handler preserves the API response', async () => {
  assert.deepEqual(await (await health()).json(), { ok: true, service: 'RinoMove API' })
})

test('config handler defaults to demo mode', async () => {
  assert.deepEqual(await (await config()).json(), { mode: 'demo' })
})

test('trainers handler keeps discipline filtering', async () => {
  const response = await trainers(new Request('http://localhost/api/trainers?discipline=tenis'))
  assert.equal((await response.json()).total, 2)
})
