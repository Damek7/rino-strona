# Trainer Qualification Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two short trainer signup forms with one shared seven-question qualification journey that stores complete, categorized trainer leads in Google Sheets.

**Architecture:** Both HTML pages expose the same step contract and use `trainer-signup.js` for navigation, conditional fields, validation, and submission. `server.js` remains the trust boundary: it normalizes and validates every answer, assigns `qualified`, `review`, or `waitlist`, and forwards one complete record to Google Apps Script.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js 22 `node:http`, `node:test`, Playwright, Google Apps Script.

## Global Constraints

- The visible form copy must not contain the word “pilotaż”.
- The journey contains exactly seven qualification questions; contact data appears after question seven.
- The same question and payload contract is used on `index.html` and `dla-trenerow.html`.
- Contact data is not written to `localStorage` and is sent only on final submission.
- The existing honeypot, request limit, server-side webhook secret, and private Google Sheet remain in place.
- A failed request preserves every entered answer.
- The browser never sees `GOOGLE_SHEETS_WEBHOOK_URL` or `GOOGLE_SHEETS_WEBHOOK_SECRET`.

---

## File Structure

- Modify `test/waitlist-api.test.js`: full payload, validation, and qualification status tests.
- Modify `server.js`: normalization, validation, status calculation, and webhook forwarding.
- Modify `test/trainer-signup-form.test.js`: identical seven-step markup contract on both pages.
- Create `test/trainer-signup-wizard.test.js`: real-browser navigation, persistence, and conditional-field tests.
- Modify `index.html`: homepage instance of the shared seven-question markup.
- Modify `dla-trenerow.html`: trainer-page instance of the same markup and scoped visual shell.
- Modify `cta.css`: shared wizard layout, options, progress, navigation, states, and responsive behavior.
- Modify `trainer-signup.js`: form controller and final request payload.
- Modify `test/google-sheets-script.test.js`: exact expanded row contract.
- Modify `integrations/google-sheets/Code.gs`: append all answers and the qualification status.
- Modify `integrations/google-sheets/README.md`: exact worksheet headers and deployment check.

---

### Task 1: Server contract and qualification status

**Files:**
- Modify: `test/waitlist-api.test.js:5-90`
- Modify: `server.js:92-120`
- Modify: `server.js:166`

**Interfaces:**
- Consumes: `createWaitlistHandler({ webhookUrl, webhookSecret, fetchImpl })` and JSON payload `{name,email,phone,profileUrl,discipline,city,district,venue,workModel,capacity,blocker,whyNow,readiness,desiredResult,desiredResultOther,source,consent,website}`.
- Produces: `qualificationStatus({ city, capacity, readiness }) -> "qualified" | "review" | "waitlist"` and a normalized webhook payload containing `qualificationStatus`.

- [ ] **Step 1: Replace the small fixture with a complete valid lead and add status tests**

```js
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
```

Update the forwarding assertion to expect this normalized body:

```js
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
```

Add explicit invalid cases:

```js
for (const [field, value, message] of [
  ['phone', 'abc', /telefon/i],
  ['workModel', 'unknown', /model pracy/i],
  ['capacity', 'unknown', /wolne miejsca/i],
  ['blocker', 'Za krótko', /utrudnia/i],
  ['whyNow', 'Za krótko', /właśnie teraz/i],
  ['readiness', [], /RinoMove/i],
  ['desiredResult', 'other', /rezultat/i]
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
```

- [ ] **Step 2: Run the endpoint tests and confirm RED**

Run: `node --test test/waitlist-api.test.js`

Expected: FAIL because `qualificationStatus` is not exported and the existing handler forwards only five fields.

- [ ] **Step 3: Add exact normalization, validation, and status calculation**

Insert before `createWaitlistHandler`:

```js
const workModels = new Set(['independent', 'club', 'mixed', 'team'])
const capacities = new Set(['none', 'one_to_two', 'three_to_five', 'more_than_five'])
const readinessOptions = new Set(['profile', 'availability', 'bookings', 'payments', 'feedback'])
const desiredResults = new Set(['new_client', 'regular_bookings', 'less_scheduling', 'easier_service', 'visibility', 'other'])

function qualificationStatus({ city, capacity, readiness }) {
  if (String(city || '').trim().toLocaleLowerCase('pl') !== 'warszawa') return 'waitlist'
  const selected = new Set(Array.isArray(readiness) ? readiness : [])
  const coreReady = ['profile', 'availability', 'bookings'].every(value => selected.has(value))
  return capacity !== 'none' && coreReady ? 'qualified' : 'review'
}
```

Replace `createWaitlistHandler` with:

```js
function createWaitlistHandler({ webhookUrl, webhookSecret, fetchImpl = fetch }) {
  const url = String(webhookUrl || '').trim()
  const secret = String(webhookSecret || '').trim()
  return async input => {
    const data = input || {}
    if (String(data.website || '').trim()) return { status: 200, body: { ok: true } }

    const lead = {
      name: String(data.name || '').trim(),
      email: String(data.email || '').trim().toLowerCase(),
      phone: String(data.phone || '').trim(),
      profileUrl: String(data.profileUrl || '').trim(),
      discipline: String(data.discipline || '').trim(),
      city: String(data.city || '').trim(),
      district: String(data.district || '').trim(),
      venue: String(data.venue || '').trim(),
      workModel: String(data.workModel || '').trim(),
      capacity: String(data.capacity || '').trim(),
      blocker: String(data.blocker || '').trim(),
      whyNow: String(data.whyNow || '').trim(),
      readiness: [...new Set(Array.isArray(data.readiness) ? data.readiness.map(String) : [])],
      desiredResult: String(data.desiredResult || '').trim(),
      desiredResultOther: String(data.desiredResultOther || '').trim(),
      source: String(data.source || '').trim(),
    }

    if (lead.name.length < 2 || lead.name.length > 80) return { status: 422, body: { error: 'Podaj imię i nazwisko (2–80 znaków).' } }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return { status: 422, body: { error: 'Podaj prawidłowy adres e-mail.' } }
    if (!/^[0-9+ ()-]{7,24}$/.test(lead.phone)) return { status: 422, body: { error: 'Podaj prawidłowy numer telefonu.' } }
    if (lead.profileUrl.length > 240) return { status: 422, body: { error: 'Link do profilu jest za długi.' } }
    if (lead.discipline.length < 2 || lead.discipline.length > 80) return { status: 422, body: { error: 'Podaj dyscyplinę (2–80 znaków).' } }
    if (lead.city.length < 2 || lead.city.length > 80) return { status: 422, body: { error: 'Podaj miasto.' } }
    if (lead.district.length < 2 || lead.district.length > 80) return { status: 422, body: { error: 'Podaj dzielnicę lub obszar działania.' } }
    if (lead.venue.length > 120) return { status: 422, body: { error: 'Nazwa obiektu jest za długa.' } }
    if (!workModels.has(lead.workModel)) return { status: 422, body: { error: 'Wybierz model pracy.' } }
    if (!capacities.has(lead.capacity)) return { status: 422, body: { error: 'Wybierz liczbę wolnych miejsc.' } }
    if (lead.blocker.length < 30 || lead.blocker.length > 1000) return { status: 422, body: { error: 'Opisz, co utrudnia Ci pozyskiwanie lub obsługę klientów.' } }
    if (lead.whyNow.length < 20 || lead.whyNow.length > 800) return { status: 422, body: { error: 'Napisz, dlaczego szukasz rozwiązania właśnie teraz.' } }
    if (!lead.readiness.length || lead.readiness.some(value => !readinessOptions.has(value))) return { status: 422, body: { error: 'Wybierz, z czego jesteś gotowy korzystać w RinoMove.' } }
    if (!desiredResults.has(lead.desiredResult)) return { status: 422, body: { error: 'Wybierz oczekiwany rezultat.' } }
    if (lead.desiredResult === 'other' && lead.desiredResultOther.length < 3) return { status: 422, body: { error: 'Opisz oczekiwany rezultat.' } }
    if (!['homepage', 'trainer_page'].includes(lead.source)) return { status: 422, body: { error: 'Nieprawidłowe źródło zgłoszenia.' } }
    if (data.consent !== true) return { status: 422, body: { error: 'Zaznacz zgodę na kontakt.' } }
    if (!url || !secret) return { status: 503, body: { error: 'Zapisy są chwilowo niedostępne. Spróbuj ponownie później.' } }

    lead.qualificationStatus = qualificationStatus(lead)
    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, ...lead }),
      })
      if (!response.ok) throw new Error('Webhook rejected request')
      return { status: 200, body: { ok: true } }
    } catch {
      return { status: 502, body: { error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.' } }
    }
  }
}
```

Export the helper:

```js
module.exports = { server, trainers, filterTrainers, createWaitlistHandler, qualificationStatus }
```

- [ ] **Step 4: Run the endpoint tests and full suite**

Run: `node --test test/waitlist-api.test.js && npm test`

Expected: endpoint tests PASS; the existing form and Sheets tests may still PASS against the old frontend contract.

- [ ] **Step 5: Commit the server contract**

```bash
git add server.js test/waitlist-api.test.js
git commit -m "feat: qualify trainer applications"
```

---

### Task 2: Seven-question wizard on both pages

**Files:**
- Modify: `test/trainer-signup-form.test.js:10-49`
- Create: `test/trainer-signup-wizard.test.js`
- Modify: `index.html:603-636`
- Modify: `dla-trenerow.html:25`
- Modify: `dla-trenerow.html:117-124`
- Modify: `cta.css:13-236`
- Modify: `trainer-signup.js:1-48`

**Interfaces:**
- Consumes: form nodes marked `[data-trainer-signup]`, seven `[data-signup-step]` fieldsets, `[data-signup-contact]`, and `data-source="homepage|trainer_page"`.
- Produces: final `/api/waitlist` JSON matching Task 1 and wizard behavior with next, back, progress, conditional result text, preserved values on error, and reset on success.

- [ ] **Step 1: Replace the markup-contract assertions with the seven-step contract**

```js
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
```

- [ ] **Step 2: Add a real-browser wizard regression test**

Create `test/trainer-signup-wizard.test.js`:

```js
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
  await browser.close()
  await new Promise(resolve => server.close(resolve))
})

test('wizard moves forward and back without losing answers', async () => {
  const page = await browser.newPage()
  await page.goto(`${baseUrl}/index.html#zapisy`)
  const form = page.locator('[data-trainer-signup]')
  await form.locator('[name="discipline"]').fill('Tenis')
  await form.locator('[name="city"]').fill('Warszawa')
  await form.locator('[name="district"]').fill('Mokotów')
  await form.locator('[data-signup-next]').click()
  await assert.doesNotReject(() => form.locator('[name="workModel"]').waitFor({ state: 'visible' }))
  await form.locator('[data-signup-back]').click()
  assert.equal(await form.locator('[name="discipline"]').inputValue(), 'Tenis')
  await page.close()
})

test('other result reveals and requires the explanation field', async () => {
  const page = await browser.newPage()
  await page.goto(`${baseUrl}/index.html#zapisy`)
  const form = page.locator('[data-trainer-signup]')
  await form.locator('[data-signup-step]').evaluateAll(steps => steps.forEach(step => { step.hidden = true }))
  await form.locator('[data-signup-step="7"]').evaluate(step => { step.hidden = false })
  await form.locator('[name="desiredResult"][value="other"]').check()
  await assert.doesNotReject(() => form.locator('[data-other-result]').waitFor({ state: 'visible' }))
  assert.equal(await form.locator('[name="desiredResultOther"]').getAttribute('required'), '')
  await page.close()
})
```

- [ ] **Step 3: Run the frontend tests and confirm RED**

Run: `node --test test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js`

Expected: FAIL because both pages still contain the short form and the wizard controls do not exist.

- [ ] **Step 4: Replace both short forms with the exact seven-step markup**

Use this form body on both pages; only `class`, `data-source`, and surrounding card copy differ:

```html
<form class="trainer-signup-form" data-trainer-signup data-source="homepage">
  <div class="signup-progress" data-signup-progress>
    <span>Pytanie <b data-signup-current>1</b> z 7</span>
    <progress max="7" value="1" aria-label="Postęp formularza"></progress>
  </div>

  <fieldset data-signup-step="1">
    <legend>Jaką dyscyplinę trenujesz i gdzie prowadzisz treningi?</legend>
    <label>Dyscyplina<input name="discipline" required minlength="2" maxlength="80" placeholder="np. tenis"></label>
    <label>Miasto<input name="city" required minlength="2" maxlength="80" placeholder="np. Warszawa"></label>
    <label>Dzielnica lub obszar<input name="district" required minlength="2" maxlength="80" placeholder="np. Mokotów"></label>
    <label>Klub lub obiekt — opcjonalnie<input name="venue" maxlength="120" placeholder="np. Warszawianka"></label>
  </fieldset>

  <fieldset data-signup-step="2" hidden>
    <legend>W jakim modelu pracujesz?</legend>
    <label class="signup-option"><input type="radio" name="workModel" value="independent" required><span>Pracuję niezależnie</span></label>
    <label class="signup-option"><input type="radio" name="workModel" value="club"><span>Pracuję w klubie lub akademii</span></label>
    <label class="signup-option"><input type="radio" name="workModel" value="mixed"><span>Łączę pracę niezależną z klubem lub akademią</span></label>
    <label class="signup-option"><input type="radio" name="workModel" value="team"><span>Prowadzę zespół trenerów</span></label>
  </fieldset>

  <fieldset data-signup-step="3" hidden>
    <legend>Ilu nowych klientów możesz obecnie przyjąć?</legend>
    <label class="signup-option"><input type="radio" name="capacity" value="none" required><span>Obecnie nie mam wolnych miejsc</span></label>
    <label class="signup-option"><input type="radio" name="capacity" value="one_to_two"><span>1–2 klientów miesięcznie</span></label>
    <label class="signup-option"><input type="radio" name="capacity" value="three_to_five"><span>3–5 klientów miesięcznie</span></label>
    <label class="signup-option"><input type="radio" name="capacity" value="more_than_five"><span>Więcej niż 5 klientów miesięcznie</span></label>
  </fieldset>

  <fieldset data-signup-step="4" hidden>
    <legend>Co najbardziej utrudnia Ci pozyskiwanie lub obsługę klientów i czego już próbowałeś?</legend>
    <textarea name="blocker" required minlength="30" maxlength="1000" rows="6" placeholder="Napisz własnymi słowami"></textarea>
    <small>Minimum 30 znaków.</small>
  </fieldset>

  <fieldset data-signup-step="5" hidden>
    <legend>Co sprawiło, że myślisz o nowym rozwiązaniu właśnie teraz?</legend>
    <textarea name="whyNow" required minlength="20" maxlength="800" rows="5" placeholder="Napisz, co zmieniło się ostatnio"></textarea>
    <small>Minimum 20 znaków.</small>
  </fieldset>

  <fieldset data-signup-step="6" hidden>
    <legend>Z czego jesteś gotowy korzystać w RinoMove?</legend>
    <p class="signup-help">Możesz wybrać kilka odpowiedzi.</p>
    <label class="signup-option"><input type="checkbox" name="readiness" value="profile"><span>Przygotuję i uzupełnię swój profil</span></label>
    <label class="signup-option"><input type="checkbox" name="readiness" value="availability"><span>Dodam dostępne terminy</span></label>
    <label class="signup-option"><input type="checkbox" name="readiness" value="bookings"><span>Będę przyjmować rezerwacje przez RinoMove</span></label>
    <label class="signup-option"><input type="checkbox" name="readiness" value="payments"><span>Będę obsługiwać płatności przez RinoMove</span></label>
    <label class="signup-option"><input type="checkbox" name="readiness" value="feedback"><span>Będę przekazywać uwagi o działaniu RinoMove</span></label>
  </fieldset>

  <fieldset data-signup-step="7" hidden>
    <legend>Jaki rezultat sprawiłby, że uznasz korzystanie z RinoMove za wartościowe?</legend>
    <label class="signup-option"><input type="radio" name="desiredResult" value="new_client" required><span>Pozyskanie przynajmniej jednego nowego klienta</span></label>
    <label class="signup-option"><input type="radio" name="desiredResult" value="regular_bookings"><span>Więcej regularnych rezerwacji</span></label>
    <label class="signup-option"><input type="radio" name="desiredResult" value="less_scheduling"><span>Mniej czasu na ustalanie terminów</span></label>
    <label class="signup-option"><input type="radio" name="desiredResult" value="easier_service"><span>Wygodniejsza obsługa rezerwacji i płatności</span></label>
    <label class="signup-option"><input type="radio" name="desiredResult" value="visibility"><span>Profesjonalny profil i większa widoczność</span></label>
    <label class="signup-option"><input type="radio" name="desiredResult" value="other"><span>Inny rezultat</span></label>
    <label data-other-result hidden>Jaki rezultat?<input name="desiredResultOther" minlength="3" maxlength="240"></label>
  </fieldset>

  <fieldset data-signup-contact hidden>
    <legend>Zostaw kontakt — sprawdzimy Twoje zgłoszenie</legend>
    <label>Imię i nazwisko<input name="name" autocomplete="name" required minlength="2" maxlength="80"></label>
    <label>Adres e-mail<input name="email" autocomplete="email" type="email" required maxlength="120"></label>
    <label>Numer telefonu<input name="phone" autocomplete="tel" type="tel" required minlength="7" maxlength="24"></label>
    <label>Instagram lub własna strona — opcjonalnie<input name="profileUrl" type="url" maxlength="240" placeholder="https://"></label>
    <label class="rodo"><input type="checkbox" name="consent" required><span>Wyrażam zgodę na kontakt w sprawie dołączenia do RinoMove i przetwarzanie danych w tym celu.</span></label>
    <div class="form-trap" aria-hidden="true" hidden><label>Strona internetowa<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <button type="submit" class="btn btn-primary btn-block">Wyślij zgłoszenie</button>
  </fieldset>

  <div class="signup-nav">
    <button type="button" class="signup-back" data-signup-back hidden>Wstecz</button>
    <button type="button" class="btn btn-primary" data-signup-next>Dalej</button>
  </div>
  <p class="signup-status" data-signup-status role="status" aria-live="polite"></p>
</form>
```

For `dla-trenerow.html`, use `class="interest-form trainer-signup-form"` and `data-source="trainer_page"`. Replace the surrounding copy on both pages with “7 pytań, około 3 minuty. Sprawdzimy, czy RinoMove pasuje do Twojego sposobu pracy.”

- [ ] **Step 5: Implement the shared wizard controller**

Replace `trainer-signup.js` with:

```js
(() => {
  function setup(form) {
    const steps = [...form.querySelectorAll('[data-signup-step]')]
    const contact = form.querySelector('[data-signup-contact]')
    const back = form.querySelector('[data-signup-back]')
    const next = form.querySelector('[data-signup-next]')
    const currentLabel = form.querySelector('[data-signup-current]')
    const progress = form.querySelector('progress')
    const status = form.querySelector('[data-signup-status]')
    const other = form.querySelector('[data-other-result]')
    const otherInput = form.elements.desiredResultOther
    let current = 0

    function activePanel() {
      return current < steps.length ? steps[current] : contact
    }

    function render() {
      steps.forEach((step, index) => { step.hidden = index !== current })
      contact.hidden = current !== steps.length
      currentLabel.textContent = String(Math.min(current + 1, 7))
      progress.value = Math.min(current + 1, 7)
      back.hidden = current === 0
      next.hidden = current === steps.length
      activePanel().querySelector('input, textarea')?.focus()
    }

    function panelValid(panel) {
      const readiness = panel.querySelectorAll('[name="readiness"]')
      if (readiness.length && ![...readiness].some(input => input.checked)) {
        readiness[0].setCustomValidity('Wybierz przynajmniej jedną odpowiedź.')
        readiness[0].reportValidity()
        return false
      }
      readiness.forEach(input => input.setCustomValidity(''))
      const controls = [...panel.querySelectorAll('input, textarea')].filter(input => !input.disabled)
      const invalid = controls.find(input => !input.checkValidity())
      if (invalid) {
        invalid.reportValidity()
        return false
      }
      return true
    }

    next.addEventListener('click', () => {
      if (!panelValid(activePanel())) return
      current += 1
      render()
    })

    back.addEventListener('click', () => {
      current = Math.max(0, current - 1)
      render()
    })

    form.addEventListener('change', event => {
      if (event.target.name !== 'desiredResult') return
      const show = event.target.value === 'other'
      other.hidden = !show
      otherInput.required = show
      if (!show) otherInput.value = ''
    })

    form.addEventListener('submit', async event => {
      event.preventDefault()
      if (form.dataset.submitting === 'true' || !panelValid(contact)) return
      const button = form.querySelector('[type="submit"]')
      const data = new FormData(form)
      const originalLabel = button.textContent
      form.dataset.submitting = 'true'
      button.disabled = true
      button.textContent = 'Wysyłanie…'
      status.textContent = ''
      status.classList.remove('is-success', 'is-error')

      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.get('name'),
            email: data.get('email'),
            phone: data.get('phone'),
            profileUrl: data.get('profileUrl'),
            discipline: data.get('discipline'),
            city: data.get('city'),
            district: data.get('district'),
            venue: data.get('venue'),
            workModel: data.get('workModel'),
            capacity: data.get('capacity'),
            blocker: data.get('blocker'),
            whyNow: data.get('whyNow'),
            readiness: data.getAll('readiness'),
            desiredResult: data.get('desiredResult'),
            desiredResultOther: data.get('desiredResultOther'),
            consent: data.get('consent') === 'on',
            website: data.get('website'),
            source: form.dataset.source
          })
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Nie udało się wysłać zgłoszenia.')
        form.reset()
        current = 0
        other.hidden = true
        otherInput.required = false
        render()
        status.textContent = 'Dziękujemy! Sprawdzimy zgłoszenie i skontaktujemy się z wybranymi trenerami.'
        status.classList.add('is-success')
      } catch (error) {
        status.textContent = error.message || 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'
        status.classList.add('is-error')
      } finally {
        delete form.dataset.submitting
        button.disabled = false
        button.textContent = originalLabel
      }
    })

    render()
  }

  document.querySelectorAll('[data-trainer-signup]').forEach(setup)
})()
```

- [ ] **Step 6: Add shared responsive wizard styles and scope the trainer page to them**

Add to `cta.css` and mirror only the necessary CSS variables/selectors in the inline trainer-page stylesheet:

```css
.trainer-signup-form fieldset {
  display: grid;
  gap: 14px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.trainer-signup-form fieldset[hidden],
.trainer-signup-form [hidden] { display: none !important; }
.trainer-signup-form legend {
  margin-bottom: 10px;
  color: #1c1b20;
  font: 800 clamp(1.35rem, 3vw, 2rem)/1.15 Manrope, sans-serif;
  letter-spacing: -.035em;
}
.trainer-signup-form label:not(.signup-option):not(.rodo) {
  display: grid;
  gap: 7px;
  color: #3a3941;
  font-size: 13px;
  font-weight: 700;
}
.trainer-signup-form input:not([type="radio"]):not([type="checkbox"]),
.trainer-signup-form textarea {
  width: 100%;
  min-height: 52px;
  padding: 13px 15px;
  border: 1px solid #dedbe0;
  border-radius: 12px;
  background: #fff;
  color: #1c1b20;
  font: 15px DM Sans, sans-serif;
}
.trainer-signup-form textarea { min-height: 132px; resize: vertical; }
.signup-progress { display: grid; gap: 8px; color: #65636d; font-size: 12px; font-weight: 700; }
.signup-progress progress { width: 100%; height: 7px; accent-color: #c72562; }
.signup-option {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 14px;
  border: 1px solid #dedbe0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}
.signup-option:has(input:checked) { border-color: #c72562; background: #fbf3f7; }
.signup-option input { flex: 0 0 auto; width: 18px; height: 18px; margin-top: 1px; accent-color: #c72562; }
.signup-help, .trainer-signup-form small { color: #65636d; font-size: 12px; }
.signup-nav { display: flex; justify-content: space-between; gap: 12px; }
.signup-back { min-height: 48px; padding: 11px 18px; border: 1px solid #dedbe0; border-radius: 12px; background: #fff; font-weight: 800; cursor: pointer; }
.signup-nav [data-signup-next] { margin-left: auto; min-width: 140px; }
@media (max-width: 640px) {
  .signup-nav { align-items: stretch; flex-direction: column-reverse; }
  .signup-nav button { width: 100%; }
}
```

Remove the obsolete two-column `.interest-form` rules that conflict with one-question panels, but preserve `.form-trap`, success/error colors, and the existing card shells.

- [ ] **Step 7: Run frontend and full tests**

Run: `node --test test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js && npm test`

Expected: all tests PASS.

- [ ] **Step 8: Commit the wizard**

```bash
git add index.html dla-trenerow.html cta.css trainer-signup.js test/trainer-signup-form.test.js test/trainer-signup-wizard.test.js
git commit -m "feat: add trainer qualification wizard"
```

---

### Task 3: Expanded Google Sheets row

**Files:**
- Modify: `test/google-sheets-script.test.js:9-16`
- Modify: `integrations/google-sheets/Code.gs:4-24`
- Modify: `integrations/google-sheets/README.md`

**Interfaces:**
- Consumes: normalized webhook payload from Task 1.
- Produces: one row ordered as timestamp, contact, location, business answers, readiness, desired result, qualification status, source, workflow status, contact date, notes.

- [ ] **Step 1: Update the Apps Script contract test**

```js
test('Apps Script stores the complete qualified trainer record', () => {
  const script = fs.readFileSync(scriptPath, 'utf8')
  assert.match(script, /WEBHOOK_SECRET/)
  assert.match(script, /input\.readiness\.join\(', '\)/)
  assert.match(script, /input\.qualificationStatus/)
  for (const field of ['phone', 'profileUrl', 'city', 'district', 'venue', 'workModel', 'capacity', 'blocker', 'whyNow', 'desiredResult', 'desiredResultOther']) {
    assert.match(script, new RegExp(`input\\.${field}`))
  }
  assert.match(script, /'Nowy', '', ''/)
})
```

- [ ] **Step 2: Run the Sheets test and confirm RED**

Run: `node --test test/google-sheets-script.test.js`

Expected: FAIL because `Code.gs` still writes the old eight-column row.

- [ ] **Step 3: Replace the row with the expanded exact order**

```js
sheet.appendRow([
  new Date(),
  input.name,
  input.email,
  input.phone,
  input.profileUrl || '',
  input.discipline,
  input.city,
  input.district,
  input.venue || '',
  input.workModel,
  input.capacity,
  input.blocker,
  input.whyNow,
  Array.isArray(input.readiness) ? input.readiness.join(', ') : '',
  input.desiredResult,
  input.desiredResultOther || '',
  input.qualificationStatus,
  input.source,
  'Nowy',
  '',
  ''
])
```

Document this header row in `integrations/google-sheets/README.md`:

```text
Data zgłoszenia | Imię i nazwisko | E-mail | Telefon | Profil / strona | Dyscyplina | Miasto | Dzielnica | Klub / obiekt | Model pracy | Wolne miejsca | Problem i próby | Dlaczego teraz | Gotowość w RinoMove | Oczekiwany rezultat | Inny rezultat | Kwalifikacja | Źródło | Status | Data kontaktu | Notatki
```

State that the header must be updated before deploying the new Apps Script version, then redeploy the web app without changing the existing secret.

- [ ] **Step 4: Run the Sheets and full tests**

Run: `node --test test/google-sheets-script.test.js && npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit the Sheets contract**

```bash
git add integrations/google-sheets/Code.gs integrations/google-sheets/README.md test/google-sheets-script.test.js
git commit -m "feat: store trainer qualification answers"
```

---

### Task 4: Browser, accessibility, and final verification

**Files:**
- Verify: `index.html`
- Verify: `dla-trenerow.html`
- Verify: `trainer-signup.js`
- Verify: `server.js`
- Verify: `integrations/google-sheets/Code.gs`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: verified desktop/mobile journey with no unrelated changes and an actionable deployment note for the private Sheet.

- [ ] **Step 1: Run the complete automated verification**

Run: `npm test`

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Start the local server and inspect both desktop forms**

Run: `npm start`

Open:

```text
http://localhost:8787/index.html#zapisy
http://localhost:8787/dla-trenerow.html#kontakt
```

Verify on each page:

```text
Question 1 is visible; questions 2–7 and contact are hidden.
Progress reads 1 of 7.
Invalid current fields prevent “Dalej”.
Back restores the preceding screen without clearing values.
Question 6 accepts multiple choices.
Question 7 shows the extra field only for “Inny rezultat”.
Contact appears after question 7.
No visible copy contains “pilotaż”.
```

- [ ] **Step 3: Inspect both forms at a 390 × 844 mobile viewport**

Verify:

```text
No horizontal overflow.
Every option and button is fully visible and tappable.
The sticky site navigation does not cover the focused field.
The progress bar and question legend fit without clipping.
Back and next buttons stack without changing their order semantically.
```

- [ ] **Step 4: Exercise error preservation without a configured webhook**

Complete all seven questions and contact data locally, submit once, and verify:

```text
The 503 message is shown in the form.
The form remains on the contact step.
All answers and contact fields remain populated.
No contact data appears in localStorage.
```

- [ ] **Step 5: Run repository hygiene checks**

Run:

```bash
git diff --check
git status --short
git log -4 --oneline
```

Expected: `git diff --check` has no output; status contains only intentional feature changes plus the pre-existing unrelated untracked directories; the log shows the three feature commits after the design and plan commits.

- [ ] **Step 6: Commit any verification-only correction**

If verification required a correction, stage only its exact files and use:

```bash
git commit -m "fix: polish trainer qualification flow"
```

If no correction was required, do not create an empty commit.

- [ ] **Step 7: Report the external deployment step without performing it silently**

Report:

```text
The local feature is complete. Before production submissions can use the expanded schema, update the private Sheet header in the documented order and deploy a new Apps Script web-app version with the existing WEBHOOK_SECRET.
```

Do not submit synthetic personal data or modify the live private Sheet unless the user explicitly authorizes that external write.
