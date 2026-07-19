const SPREADSHEET_ID = '1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo'
const SHEET_NAME = 'Zgłoszenia trenerów'

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value
}

function doPost(e) {
  const input = JSON.parse(e.postData.contents)
  const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET')

  if (!expectedSecret || input.secret !== expectedSecret) {
    throw new Error('Forbidden')
  }

  Object.keys(input).forEach(function (key) {
    if (key !== 'secret' && typeof input[key] === 'string') input[key] = safeCell(input[key])
  })

  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME)
    sheet.appendRow([
      new Date(),
      input.name,
      input.email,
      input.phone,
      input.profileUrl,
      input.discipline,
      input.city,
      input.district,
      input.workModel,
      input.acceptingClients,
      input.primaryNeed,
      input.blocker,
      input.qualificationStatus,
      input.source,
      'Nowy',
      '',
      ''
    ])
  } finally {
    lock.releaseLock()
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
