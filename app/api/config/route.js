const { publicConfig } = require('../../../lib/supabase-config')

function GET() {
  return Response.json(publicConfig(process.env), { headers: { 'Cache-Control': 'no-store' } })
}

module.exports = { GET }
