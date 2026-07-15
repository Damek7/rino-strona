'use strict'

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { publicConfig } = require('./lib/supabase-config')

const ROOT = __dirname
const PORT = Number(process.env.PORT || 8787)
const VENDOR_SUPABASE = path.join(ROOT, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js')
const trainers = [
  { id: 'trainer-marek', name: 'Marek Kowalski', discipline: 'tenis', district: 'Śródmieście', price: 220, rating: 4.9, reviews: 38, level: 'Każdy poziom', verified: true, initials: 'MK' },
  { id: 'trainer-julia', name: 'Julia Nowak', discipline: 'tenis', district: 'Mokotów', price: 190, rating: 4.8, reviews: 24, level: 'Dzieci i juniorzy', verified: true, initials: 'JN' },
  { id: 'trainer-pawel', name: 'Paweł Wrona', discipline: 'boks', district: 'Wola', price: 180, rating: 5, reviews: 19, level: 'Początkujący', verified: true, initials: 'PW' },
  { id: 'trainer-anna', name: 'Anna Sowa', discipline: 'padel', district: 'Wilanów', price: 240, rating: 4.9, reviews: 31, level: 'Każdy poziom', verified: true, initials: 'AS' },
]
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(data))
}

function sendFile(res, file) {
  const stat = fs.existsSync(file) && fs.statSync(file)
  if (!stat || !stat.isFile()) return json(res, 404, { error: 'Nie znaleziono pliku.' })
  res.writeHead(200, {
    'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  })
  fs.createReadStream(file).pipe(res)
}

function filterTrainers(url) {
  const q = (url.searchParams.get('q') || '').trim().toLocaleLowerCase('pl')
  const discipline = (url.searchParams.get('discipline') || '').toLowerCase()
  const district = (url.searchParams.get('district') || '').toLocaleLowerCase('pl')
  const maxPrice = Number(url.searchParams.get('maxPrice') || 0)
  return trainers.filter(trainer => {
    const text = `${trainer.name} ${trainer.discipline} ${trainer.district} ${trainer.level}`.toLocaleLowerCase('pl')
    return (!q || text.includes(q)) && (!discipline || trainer.discipline === discipline) && (!district || trainer.district.toLocaleLowerCase('pl') === district) && (!maxPrice || trainer.price <= maxPrice)
  })
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'RinoMove API' })
    if (req.method === 'GET' && url.pathname === '/api/config') return json(res, 200, publicConfig(process.env))
    if (req.method === 'GET' && url.pathname === '/api/trainers') return json(res, 200, { items: filterTrainers(url), total: filterTrainers(url).length })
    if (req.method === 'GET' && url.pathname === '/vendor/supabase.js') return sendFile(res, VENDOR_SUPABASE)
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Nie znaleziono endpointu.' })

    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    const file = path.resolve(ROOT, `.${relative}`)
    if (!(file === ROOT || file.startsWith(`${ROOT}${path.sep}`)) || file.includes(`${path.sep}data${path.sep}`) || file.includes(`${path.sep}node_modules${path.sep}`)) return json(res, 403, { error: 'Brak dostępu.' })
    return sendFile(res, file)
  } catch (error) {
    if (!res.headersSent) json(res, 500, { error: 'Błąd serwera.' })
    console.error(error)
  }
})

if (require.main === module) server.listen(PORT, () => console.log(`RinoMove działa: http://localhost:${PORT}`))

module.exports = { server, trainers, filterTrainers }
