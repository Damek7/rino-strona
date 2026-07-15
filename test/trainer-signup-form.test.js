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

test('homepage exposes the trainer-only signup contract', () => {
  const form = signupForm(homepage)

  assert.match(homepage, /class="signup-kicker">Start wkrótce</)
  assert.match(form, /data-source="homepage"/)
  assert.match(form, /name="name"/)
  assert.match(form, /name="email"/)
  assert.match(form, /name="discipline"/)
  assert.match(form, /name="consent"/)
  assert.match(form, /name="website"/)
  assert.doesNotMatch(form, /Szukam trenera|Jestem trenerem/)
  assert.doesNotMatch(form, /Warszawa/)
})

test('trainer page exposes the same fields with its own source', () => {
  const form = signupForm(trainerPage)

  assert.match(trainerPage, /Start wkrótce/)
  assert.match(form, /data-source="trainer_page"/)
  for (const name of ['name', 'email', 'discipline', 'consent', 'website']) {
    assert.match(form, new RegExp(`name="${name}"`))
  }
  assert.doesNotMatch(form, /experience|certificates|Instagram/)
  assert.doesNotMatch(trainerPage, /navigator\.clipboard|Skopiuj zgłoszenie/)
})

test('both pages load the shared signup controller', () => {
  assert.match(homepage, /src="trainer-signup\.js"/)
  assert.match(trainerPage, /src="trainer-signup\.js"/)

  const script = fs.readFileSync(path.join(root, 'trainer-signup.js'), 'utf8')
  assert.match(script, /fetch\(['"]\/api\/waitlist['"]/)
  assert.match(script, /form\.dataset\.source/)
})
