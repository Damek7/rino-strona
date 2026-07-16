'use strict'

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { publicConfig } = require('./lib/supabase-config')

const ROOT = __dirname
const PORT = Number(process.env.PORT || 8787)
const MAX_BODY = 32_000
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
const rootPublicExtensions = new Set(['.html', '.css', '.js', '.ico'])
const assetExtensions = new Set(['.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp'])

function isPublicFile(file) {
  const relative = path.relative(ROOT, file)
  const parts = relative.split(path.sep)
  const extension = path.extname(file).toLowerCase()
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || parts.some(part => part.startsWith('.'))) return false
  if (parts.length === 1) return rootPublicExtensions.has(extension) && parts[0] !== 'server.js'
  if (parts[0] === 'assets') return assetExtensions.has(extension)
  if (parts[0] === 'lib') return extension === '.js'
  return false
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(data))
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => {
      raw += chunk
      if (Buffer.byteLength(raw) > MAX_BODY) {
        reject(Object.assign(new Error('Za duże żądanie.'), { status: 413 }))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(Object.assign(new Error('Nieprawidłowy JSON.'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
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

const workModels = new Set(['independent', 'club', 'mixed', 'team'])
const capacities = new Set(['none', 'one_to_two', 'three_to_five', 'more_than_five'])
const readinessOptions = new Set(['profile', 'availability', 'bookings', 'payments', 'feedback'])
const desiredResults = new Set(['new_client', 'regular_bookings', 'less_scheduling', 'easier_service', 'visibility', 'other'])

function qualificationStatus({ city, capacity, readiness }) {
  if (String(city || '').trim().toLocaleLowerCase('pl') !== 'warszawa') return 'waitlist'
  const selected = new Set(Array.isArray(readiness) ? readiness : [])
  const coreReady = ['profile', 'availability', 'bookings'].every(value => selected.has(value))
  return capacity !== 'none' && coreReady ? 'qualified' : 'review'
}

function createWaitlistHandler({ webhookUrl, webhookSecret, fetchImpl = fetch }) {
  const url = String(webhookUrl || '').trim()
  const secret = String(webhookSecret || '').trim()
  return async input => {
    const data = input || {}
    if (String(data.website || '').trim()) return { status: 200, body: { ok: true } }

    const lead = {
      name: String(data.name || '').trim(),
      email: String(data.email || '').trim().toLowerCase(),
      phone: String(data.phone || '').trim(),
      profileUrl: String(data.profileUrl || '').trim(),
      discipline: String(data.discipline || '').trim(),
      city: String(data.city || '').trim(),
      district: String(data.district || '').trim(),
      venue: String(data.venue || '').trim(),
      workModel: String(data.workModel || '').trim(),
      capacity: String(data.capacity || '').trim(),
      blocker: String(data.blocker || '').trim(),
      whyNow: String(data.whyNow || '').trim(),
      readiness: [...new Set(Array.isArray(data.readiness) ? data.readiness.map(String) : [])],
      desiredResult: String(data.desiredResult || '').trim(),
      desiredResultOther: String(data.desiredResultOther || '').trim(),
      source: String(data.source || '').trim(),
    }

    if (lead.name.length < 2 || lead.name.length > 80) return { status: 422, body: { error: 'Podaj imię i nazwisko (2–80 znaków).' } }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return { status: 422, body: { error: 'Podaj prawidłowy adres e-mail.' } }
    if (!/^[0-9+ ()-]{7,24}$/.test(lead.phone)) return { status: 422, body: { error: 'Podaj prawidłowy numer telefonu.' } }
    if (lead.profileUrl.length > 240) return { status: 422, body: { error: 'Link do profilu jest za długi.' } }
    if (lead.discipline.length < 2 || lead.discipline.length > 80) return { status: 422, body: { error: 'Podaj dyscyplinę (2–80 znaków).' } }
    if (lead.city.length < 2 || lead.city.length > 80) return { status: 422, body: { error: 'Podaj miasto.' } }
    if (lead.district.length < 2 || lead.district.length > 80) return { status: 422, body: { error: 'Podaj dzielnicę lub obszar działania.' } }
    if (lead.venue.length > 120) return { status: 422, body: { error: 'Nazwa obiektu jest za długa.' } }
    if (!workModels.has(lead.workModel)) return { status: 422, body: { error: 'Wybierz model pracy.' } }
    if (!capacities.has(lead.capacity)) return { status: 422, body: { error: 'Wybierz liczbę wolnych miejsc.' } }
    if (lead.blocker.length < 30 || lead.blocker.length > 1000) return { status: 422, body: { error: 'Opisz, co utrudnia Ci pozyskiwanie lub obsługę klientów.' } }
    if (lead.whyNow.length < 20 || lead.whyNow.length > 800) return { status: 422, body: { error: 'Napisz, dlaczego szukasz rozwiązania właśnie teraz.' } }
    if (!lead.readiness.length || lead.readiness.some(value => !readinessOptions.has(value))) return { status: 422, body: { error: 'Wybierz, z czego jesteś gotowy korzystać w RinoMove.' } }
    if (!desiredResults.has(lead.desiredResult)) return { status: 422, body: { error: 'Wybierz oczekiwany rezultat.' } }
    if (lead.desiredResult === 'other' && lead.desiredResultOther.length < 3) return { status: 422, body: { error: 'Opisz oczekiwany rezultat.' } }
    if (!['homepage', 'trainer_page'].includes(lead.source)) return { status: 422, body: { error: 'Nieprawidłowe źródło zgłoszenia.' } }
    if (data.consent !== true) return { status: 422, body: { error: 'Zaznacz zgodę na kontakt.' } }
    if (!url || !secret) return { status: 503, body: { error: 'Zapisy są chwilowo niedostępne. Spróbuj ponownie później.' } }

    lead.qualificationStatus = qualificationStatus(lead)
    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, ...lead }),
      })
      if (!response.ok) throw new Error('Webhook rejected request')
      return { status: 200, body: { ok: true } }
    } catch {
      return { status: 502, body: { error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.' } }
    }
  }
}

const waitlistHandler = createWaitlistHandler({
  webhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
  webhookSecret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET,
})
const waitlistAttempts = new Map()

function waitlistAllowed(ip) {
  const now = Date.now()
  const record = waitlistAttempts.get(ip) || { start: now, count: 0 }
  if (now - record.start > 60_000) {
    record.start = now
    record.count = 0
  }
  record.count += 1
  waitlistAttempts.set(ip, record)
  return record.count <= 30
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'RinoMove API' })
    if (req.method === 'GET' && url.pathname === '/api/config') return json(res, 200, publicConfig(process.env))
    if (req.method === 'GET' && url.pathname === '/api/trainers') return json(res, 200, { items: filterTrainers(url), total: filterTrainers(url).length })
    if (req.method === 'POST' && url.pathname === '/api/waitlist') {
      if (!waitlistAllowed(req.socket.remoteAddress || 'local')) return json(res, 429, { error: 'Za dużo prób. Spróbuj ponownie za minutę.' })
      const result = await waitlistHandler(await body(req))
      return json(res, result.status, result.body)
    }
    if (req.method === 'GET' && url.pathname === '/vendor/supabase.js') return sendFile(res, VENDOR_SUPABASE)
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Nie znaleziono endpointu.' })

    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    const file = path.resolve(ROOT, `.${relative}`)
    if (!(file === ROOT || file.startsWith(`${ROOT}${path.sep}`)) || !isPublicFile(file)) return json(res, 403, { error: 'Brak dostępu.' })
    return sendFile(res, file)
  } catch (error) {
    if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Błąd serwera.' })
    console.error(error)
  }
})

if (require.main === module) server.listen(PORT, () => console.log(`RinoMove działa: http://localhost:${PORT}`))

module.exports = { server, trainers, filterTrainers, createWaitlistHandler, qualificationStatus }
