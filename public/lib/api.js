'use strict'

const trainers = [
  { id: 'trainer-marek', name: 'Marek Kowalski', discipline: 'tenis', district: 'Śródmieście', price: 220, rating: 4.9, reviews: 38, level: 'Każdy poziom', verified: true, initials: 'MK' },
  { id: 'trainer-julia', name: 'Julia Nowak', discipline: 'tenis', district: 'Mokotów', price: 190, rating: 4.8, reviews: 24, level: 'Dzieci i juniorzy', verified: true, initials: 'JN' },
  { id: 'trainer-pawel', name: 'Paweł Wrona', discipline: 'boks', district: 'Wola', price: 180, rating: 5, reviews: 19, level: 'Początkujący', verified: true, initials: 'PW' },
  { id: 'trainer-anna', name: 'Anna Sowa', discipline: 'padel', district: 'Wilanów', price: 240, rating: 4.9, reviews: 31, level: 'Każdy poziom', verified: true, initials: 'AS' },
]

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
      name: String(data.name || '').trim(), email: String(data.email || '').trim().toLowerCase(), phone: String(data.phone || '').trim(), profileUrl: String(data.profileUrl || '').trim(), discipline: String(data.discipline || '').trim(), city: String(data.city || '').trim(), district: String(data.district || '').trim(), venue: String(data.venue || '').trim(), workModel: String(data.workModel || '').trim(), capacity: String(data.capacity || '').trim(), blocker: String(data.blocker || '').trim(), whyNow: String(data.whyNow || '').trim(), readiness: [...new Set(Array.isArray(data.readiness) ? data.readiness.map(String) : [])], desiredResult: String(data.desiredResult || '').trim(), desiredResultOther: String(data.desiredResultOther || '').trim(), source: String(data.source || '').trim(),
    }

    if (lead.name.length < 2 || lead.name.length > 80) return { status: 422, body: { error: 'Podaj imię i nazwisko (2–80 znaków).' } }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return { status: 422, body: { error: 'Podaj prawidłowy adres e-mail.' } }
    if (!/^[0-9+ ()-]{7,24}$/.test(lead.phone)) return { status: 422, body: { error: 'Podaj prawidłowy numer telefonu.' } }
    if (lead.profileUrl.length > 240) return { status: 422, body: { error: 'Link do profilu jest za długi.' } }
    if (lead.profileUrl) {
      try { const profileUrl = new URL(lead.profileUrl); if (!['http:', 'https:'].includes(profileUrl.protocol)) throw new Error('Unsupported protocol') } catch { return { status: 422, body: { error: 'Podaj prawidłowy link do profilu.' } } }
    }
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
    if (lead.desiredResultOther.length > 240 || (lead.desiredResult === 'other' && lead.desiredResultOther.length < 3)) return { status: 422, body: { error: 'Opisz oczekiwany rezultat (3–240 znaków).' } }
    if (!['homepage', 'trainer_page'].includes(lead.source)) return { status: 422, body: { error: 'Nieprawidłowe źródło zgłoszenia.' } }
    if (data.consent !== true) return { status: 422, body: { error: 'Zaznacz zgodę na kontakt.' } }
    if (!url || !secret) return { status: 503, body: { error: 'Zapisy są chwilowo niedostępne. Spróbuj ponownie później.' } }

    lead.qualificationStatus = qualificationStatus(lead)
    try {
      const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret, ...lead }) })
      if (!response.ok) throw new Error('Webhook rejected request')
      return { status: 200, body: { ok: true } }
    } catch { return { status: 502, body: { error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.' } } }
  }
}

module.exports = { trainers, filterTrainers, qualificationStatus, createWaitlistHandler }
