const { test } = require('node:test')
const assert = require('node:assert/strict')
const { server } = require('../server')
const fs = require('node:fs')
const path = require('node:path')

test('start command runs the Next.js production server', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  assert.equal(pkg.scripts.start, 'next start')
})

test('server exposes the app and public config but never repository files', async t => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`

  const health = await fetch(`${base}/api/health`)
  const config = await fetch(`${base}/api/config`)
  const panel = await fetch(`${base}/panel.html`)
  const vendor = await fetch(`${base}/vendor/supabase.js`)
  const manifest = await fetch(`${base}/package.json`)
  const env = await fetch(`${base}/.env`)
  const serverSource = await fetch(`${base}/server.js`)
  const tests = await fetch(`${base}/test/domain.test.js`)

  assert.equal(health.status, 200)
  assert.deepEqual(await config.json(), { mode: 'demo' })
  assert.equal(panel.status, 200)
  assert.equal(vendor.status, 200)
  assert.equal(manifest.status, 403)
  assert.equal(env.status, 403)
  assert.equal(serverSource.status, 403)
  assert.equal(tests.status, 403)
})
