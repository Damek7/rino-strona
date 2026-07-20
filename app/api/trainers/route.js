const { filterTrainers } = require('../../../lib/api')

function GET(request) {
  const items = filterTrainers(new URL(request.url))
  return Response.json({ items, total: items.length }, { headers: { 'Cache-Control': 'no-store' } })
}

module.exports = { GET }
