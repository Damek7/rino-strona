const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const scriptPath = path.join(root, 'integrations', 'google-sheets', 'Code.gs')

test('Apps Script targets the trainer lead sheet and protects writes with a secret', () => {
  const script = fs.readFileSync(scriptPath, 'utf8')

  assert.match(script, /1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo/)
  assert.match(script, /Zgłoszenia trenerów/)
  assert.match(script, /WEBHOOK_SECRET/)
  assert.match(script, /appendRow\(\[new Date\(\), input\.name, input\.email, input\.discipline, input\.source, 'Nowy', '', ''\]\)/)
})
