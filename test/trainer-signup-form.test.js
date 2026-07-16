const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const trainerPage = fs.readFileSync(path.join(root, 'dla-trenerow.html'), 'utf8')

function signupForm(html) {
  const match = html.match(/<form[^>]*data-trainer-signup[\s\S]*?<\/form>/)
  assert.ok(match, 'trainer signup form should be present')
  return match[0]
}

for (const [page, html, source] of [
  ['index.html', homepage, 'homepage'],
  ['dla-trenerow.html', trainerPage, 'trainer_page']
]) {
  test(`${page} exposes the seven-question qualification contract`, () => {
    const form = signupForm(html)

    assert.match(form, new RegExp(`data-source="${source}"`))
    assert.equal((form.match(/data-signup-step/g) || []).length, 7)
    for (const name of [
      'discipline', 'city', 'district', 'venue', 'workModel', 'capacity',
      'blocker', 'whyNow', 'readiness', 'desiredResult', 'desiredResultOther',
      'name', 'email', 'phone', 'profileUrl', 'consent', 'website'
    ]) assert.match(form, new RegExp(`name="${name}"`))
    assert.match(form, /data-signup-contact/)
    assert.match(form, /data-signup-progress/)
    assert.doesNotMatch(form, /pilotaż/i)
  })
}

test('both pages load the shared wizard controller', () => {
  assert.match(homepage, /src="trainer-signup\.js"/)
  assert.match(trainerPage, /src="trainer-signup\.js"/)

  const script = fs.readFileSync(path.join(root, 'trainer-signup.js'), 'utf8')
  assert.match(script, /data-signup-next/)
  assert.match(script, /data-signup-back/)
  assert.match(script, /data-other-result/)
  assert.match(script, /data\.getAll\('readiness'\)/)
  assert.match(script, /fetch\(['"]\/api\/waitlist['"]/)
})
