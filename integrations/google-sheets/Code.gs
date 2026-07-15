const SPREADSHEET_ID = '1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo'
const SHEET_NAME = 'Zgłoszenia trenerów'

function doPost(e) {
  const input = JSON.parse(e.postData.contents)
  const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET')

  if (!expectedSecret || input.secret !== expectedSecret) {
    throw new Error('Forbidden')
  }

  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME)
    sheet.appendRow([new Date(), input.name, input.email, input.discipline, input.source, 'Nowy', '', ''])
  } finally {
    lock.releaseLock()
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
