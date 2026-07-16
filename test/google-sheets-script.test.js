const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const scriptPath = path.join(root, 'integrations', 'google-sheets', 'Code.gs')
const readmePath = path.join(root, 'integrations', 'google-sheets', 'README.md')

test('Apps Script targets the trainer lead sheet and protects writes with a secret', () => {
  const script = fs.readFileSync(scriptPath, 'utf8')

  assert.match(script, /1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo/)
  assert.match(script, /Zgłoszenia trenerów/)
  assert.match(script, /WEBHOOK_SECRET/)
  assert.match(script, /function safeCell\(value\)/)
  assert.match(script, /\^\[=\+\\-@\]/)
  assert.match(script, /input\[key\] = safeCell\(input\[key\]\)/)
  const compact = script.replace(/\s+/g, ' ')
  assert.match(compact, /appendRow\(\[ new Date\(\), input\.name, input\.email, input\.phone, input\.profileUrl, input\.discipline, input\.city, input\.district, input\.venue, input\.workModel, input\.capacity, input\.blocker, input\.whyNow, input\.readiness\.join\(', '\), input\.desiredResult, input\.desiredResultOther, input\.qualificationStatus, input\.source, 'Nowy', '', '' \]\)/)
})

test('Google Sheets setup documents the complete lead column order', () => {
  const readme = fs.readFileSync(readmePath, 'utf8')
  assert.match(readme, /Data zgłoszenia \| Imię i nazwisko \| E-mail \| Telefon \| Profil \| Dyscyplina \| Miasto \| Dzielnica \| Obiekt \| Model pracy \| Wolne miejsca \| Blokada \| Dlaczego teraz \| Gotowość \| Oczekiwany rezultat \| Inny rezultat \| Status kwalifikacji \| Źródło \| Status kontaktu \| Notatki \| Właściciel/)
})
