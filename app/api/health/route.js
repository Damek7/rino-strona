function GET() {
  return Response.json({ ok: true, service: 'RinoMove API' }, { headers: { 'Cache-Control': 'no-store' } })
}

module.exports = { GET }
