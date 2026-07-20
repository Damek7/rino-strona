const { createWaitlistHandler } = require('../../../lib/api')
const { isAllowed } = require('../../../lib/waitlist-rate-limit')

function json(status, body) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function POST(request) {
  const client = request.headers.get('x-forwarded-for') || 'local'
  if (!isAllowed(client)) return json(429, { error: 'Za dużo prób. Spróbuj ponownie za minutę.' })

  let input
  try {
    input = await request.json()
  } catch {
    return json(400, { error: 'Nieprawidłowy JSON.' })
  }

  const handle = createWaitlistHandler({
    webhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
    webhookSecret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET,
  })
  const result = await handle(input)
  return json(result.status, result.body)
}

module.exports = { POST }
