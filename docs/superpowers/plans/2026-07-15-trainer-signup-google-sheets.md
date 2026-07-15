# Trainer Signup Google Sheets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować jeden formularz zgłoszeniowy dla trenerów na obu stronach i bezpiecznie zapisywać zgłoszenia do istniejącego Google Sheets.

**Architecture:** Obie strony wysyłają identyczny kontrakt do `POST /api/waitlist`. Serwer waliduje dane i przekazuje je z sekretem do Google Apps Script, który dopisuje dokładnie jeden wiersz do prywatnego arkusza.

**Tech Stack:** statyczny HTML/CSS/JavaScript, Node.js 20 `node:http`, wbudowany `fetch`, Google Apps Script, `node:test`.

## Global Constraints

- Zbieramy wyłącznie trenerów; brak wyboru roli klient/trener.
- Tekst formularza: „Start wkrótce”, bez nazwy miasta.
- Pola widoczne: imię i nazwisko, e-mail, dyscyplina, zgoda.
- Arkusz pozostaje prywatny, a URL webhooka i sekret nie trafiają do przeglądarki.
- Zmiany są chirurgiczne; nie refaktoryzujemy niepowiązanego kodu i nie commitujemy zmian ze względu na istniejący brudny worktree.

---

### Task 1: Kontrakt endpointu waitlist

**Files:**
- Create: `test/waitlist-api.test.js`
- Modify: `server.js`

**Interfaces:**
- Consumes: `POST /api/waitlist` JSON `{name,email,discipline,source,consent,website}`.
- Produces: `createWaitlistHandler({ webhookUrl, webhookSecret, fetchImpl })` oraz odpowiedzi `200`, `422`, `502`, `503`.

- [ ] **Step 1: Write failing endpoint tests**

```js
test('forwards a valid trainer lead to the configured webhook', async () => {
  const calls = []
  const handler = createWaitlistHandler({
    webhookUrl: 'https://example.test/hook',
    webhookSecret: 'secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) })
      return { ok: true }
    }
  })
  assert.deepEqual(await handler(validLead), { status: 200, body: { ok: true } })
  assert.equal(calls[0].body.secret, 'secret')
})
```

Add separate tests for invalid input, honeypot, missing configuration, and failed webhook.

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test test/waitlist-api.test.js`

Expected: FAIL because `createWaitlistHandler` is not exported.

- [ ] **Step 3: Add the minimal handler and route**

```js
function createWaitlistHandler({webhookUrl,webhookSecret,fetchImpl=fetch}) {
  return async input => {
    // trim, validate, return neutral success for honeypot,
    // then POST the normalized payload and secret to Apps Script
  }
}
```

Wire `POST /api/waitlist` to `body(req)` and the configured handler. Export the factory for real unit tests without a network call.

- [ ] **Step 4: Run endpoint and full tests**

Run: `node --test test/waitlist-api.test.js && npm test`

Expected: all tests PASS.

### Task 2: Jeden formularz trenera na obu stronach

**Files:**
- Create: `trainer-signup.js`
- Create: `test/trainer-signup-form.test.js`
- Modify: `index.html`
- Modify: `dla-trenerow.html`
- Modify: `cta.css`

**Interfaces:**
- Consumes: forms with `[data-trainer-signup]` and `data-source="homepage|trainer_page"`.
- Produces: browser submission to `/api/waitlist`, disabled submit state and status text.

- [ ] **Step 1: Write failing markup-contract tests**

```js
for (const page of ['index.html', 'dla-trenerow.html']) {
  test(`${page} exposes the trainer-only signup contract`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf8')
    assert.match(html, /data-trainer-signup/)
    assert.match(html, /name="email"/)
    assert.match(html, /name="discipline"/)
    assert.match(html, /name="consent"/)
    assert.doesNotMatch(html, /Szukam trenera/)
  })
}
```

Also assert `Start wkrótce`, the correct `data-source`, `/api/waitlist`, and the absence of Instagram clipboard copy.

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test test/trainer-signup-form.test.js`

Expected: FAIL because both pages still expose different contracts.

- [ ] **Step 3: Implement shared submission and matching forms**

```js
document.querySelectorAll('[data-trainer-signup]').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const data = new FormData(form)
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'), email: data.get('email'),
        discipline: data.get('discipline'), consent: data.get('consent') === 'on',
        website: data.get('website'), source: form.dataset.source
      })
    })
    // render success or server error without clearing data on failure
  })
})
```

Replace the homepage role switcher and the trainer-page clipboard form with the same four visible fields plus the hidden honeypot.

- [ ] **Step 4: Run form and full tests**

Run: `node --test test/trainer-signup-form.test.js && npm test`

Expected: all tests PASS.

### Task 3: Google Apps Script and end-to-end verification

**Files:**
- Create: `integrations/google-sheets/Code.gs`
- Create: `integrations/google-sheets/README.md`
- Test: browser submission and Google Sheet row lookup.

**Interfaces:**
- Consumes: Apps Script POST `{secret,name,email,discipline,source}`.
- Produces: row `[timestamp,name,email,discipline,source,'Nowy','','']` in tab `Zgłoszenia trenerów`.

- [ ] **Step 1: Write the Apps Script contract**

```js
const SPREADSHEET_ID = '1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo'
const SHEET_NAME = 'Zgłoszenia trenerów'

function doPost(e) {
  const input = JSON.parse(e.postData.contents)
  if (input.secret !== PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET')) {
    return jsonResponse({ ok: false }, 403)
  }
  SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME)
    .appendRow([new Date(), input.name, input.email, input.discipline, input.source, 'Nowy', '', ''])
  return jsonResponse({ ok: true })
}
```

Document deployment as a web app available to anyone and the two server environment variables.

- [ ] **Step 2: Deploy/configure the webhook**

Create or update the Apps Script project, set `WEBHOOK_SECRET`, deploy the web app, and run the local server with matching `GOOGLE_SHEETS_WEBHOOK_URL` and `GOOGLE_SHEETS_WEBHOOK_SECRET`.

- [ ] **Step 3: Verify both browser flows**

Submit one clearly labeled synthetic lead from `index.html` and one from `dla-trenerow.html`; confirm success UI and exactly two rows with sources `homepage` and `trainer_page`.

- [ ] **Step 4: Clean test data and run final verification**

Remove only the two synthetic rows, run `npm test`, inspect `git diff --check`, and review the final diff for unrelated changes.
