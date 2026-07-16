(function (root, factory) {
  const domain = typeof module === 'object' && module.exports ? require('./domain') : root.RinoDomain
  const api = factory(domain)
  if (typeof module === 'object' && module.exports) module.exports = api
  root.RinoPanelHelpers = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (domain) {
  'use strict'

  const clientNavigation = [
    ['discover', 'Trenerzy', 'search'],
    ['bookings', 'Rezerwacje', 'booking'],
    ['messages', 'Wiadomości', 'message'],
    ['settings', 'Ustawienia', 'settings'],
  ]
  const trainerNavigation = [
    ['overview', 'Pulpit', 'home'],
    ['calendar', 'Kalendarz', 'calendar'],
    ['bookings', 'Rezerwacje', 'booking'],
    ['clients', 'Klienci', 'users'],
    ['messages', 'Wiadomości', 'message'],
    ['earnings', 'Zarobki', 'wallet'],
    ['profile', 'Profil trenera', 'profile'],
    ['settings', 'Ustawienia', 'settings'],
  ]
  const WARSAW_TIME_ZONE = 'Europe/Warsaw'

  function navigationForRole(role) {
    return (role === 'trainer' ? trainerNavigation : clientNavigation).map(([route, label, icon]) => ({ route, label, icon }))
  }

  function normalizeFilters(values) {
    return {
      city: String(values.city || '').trim(),
      district: String(values.district || '').trim(),
      discipline: String(values.discipline || '').trim(),
      q: String(values.q || '').trim(),
    }
  }

  function relevanceScore(trainer, q) {
    const needle = String(q || '').trim().toLocaleLowerCase('pl')
    if (!needle) return 0
    const name = String(trainer.name || '').toLocaleLowerCase('pl')
    if (name === needle) return 4
    if (name.startsWith(needle)) return 3
    if (name.includes(needle)) return 2
    return 0
  }

  function sortTrainers(trainers, sort = 'relevance', q = '') {
    const items = [...trainers]
    const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'pl')
    const tieByReviews = (a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0) || byName(a, b)
    const comparators = {
      'price-asc': (a, b) => a.hourlyRate - b.hourlyRate || tieByReviews(a, b),
      'price-desc': (a, b) => b.hourlyRate - a.hourlyRate || tieByReviews(a, b),
      'rating-desc': (a, b) => b.rating - a.rating || tieByReviews(a, b),
      'reviews-desc': (a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating || byName(a, b),
      relevance: (a, b) => relevanceScore(b, q) - relevanceScore(a, q) || b.rating - a.rating || tieByReviews(a, b),
    }
    return items.sort(comparators[sort] || comparators.relevance)
  }

  function parsePanelHash(hash) {
    const value = String(hash || '').replace(/^#/, '')
    const match = value.match(/^trainer\/([a-z0-9-]{2,80})$/i)
    if (match) return { route: 'trainer', trainerId: match[1] }
    const routes = ['discover', 'overview', 'calendar', 'bookings', 'clients', 'messages', 'earnings', 'profile', 'settings']
    return { route: routes.includes(value) ? value : 'discover', trainerId: null }
  }

  function groupSlotsByDay(slots) {
    const groups = new Map()
    slots.filter(slot => slot.status === 'available').sort((a, b) => a.startsAt.localeCompare(b.startsAt)).forEach(slot => {
      const date = localDateKey(slot.startsAt)
      if (!date) return
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date).push(slot)
    })
    return [...groups].map(([date, daySlots]) => ({ date, slots: daySlots }))
  }

  function localDateKey(value) {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return ''
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: WARSAW_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
  }

  function bookingSummary(trainer, slot) {
    return { trainerId: trainer.id, trainerName: trainer.name, slotId: slot.id, startsAt: slot.startsAt, price: trainer.hourlyRate }
  }

  function shiftWeek(anchor, direction) {
    const date = anchor instanceof Date ? new Date(anchor.getTime()) : new Date(`${String(anchor).slice(0, 10)}T12:00:00`)
    if (!Number.isFinite(date.getTime()) || ![-1, 1].includes(Number(direction))) throw new Error('Nieprawidłowy kierunek tygodnia.')
    date.setDate(date.getDate() + Number(direction) * 7)
    return date.toISOString()
  }

  function bookingActions(booking, role) {
    return ['confirmed', 'completed', 'cancelled'].filter(status => domain.canTransitionBooking(booking.status, status, role))
  }

  function validateAvailabilityInput(startsAt, endsAt, status = 'available') {
    const start = new Date(startsAt)
    const end = new Date(endsAt)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new Error('Podaj prawidłową datę i godzinę.')
    if (start <= new Date()) throw new Error('Termin musi zaczynać się w przyszłości.')
    if (end <= start) throw new Error('Koniec terminu musi być późniejszy niż początek.')
    return { startsAt: start.toISOString(), endsAt: end.toISOString(), status: status === 'blocked' ? 'blocked' : 'available' }
  }

  function validateTrainerPhoto(file) {
    if (!file) throw new Error('Dodaj zdjęcie profilowe trenera.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Zdjęcie musi być w formacie JPEG, PNG lub WebP.')
    if (file.size > 5 * 1024 * 1024) throw new Error('Zdjęcie może mieć maksymalnie 5 MB.')
    return file
  }

  function cleanMessage(value) {
    const body = String(value || '').trim()
    if (!body) throw new Error('Wiadomość nie może być pusta.')
    if (body.length > 2000) throw new Error('Wiadomość może mieć najwyżej 2000 znaków.')
    return body
  }

  function preferencePayload(values) {
    return {
      email: Boolean(values.email),
      sms: Boolean(values.sms),
      push: Boolean(values.push),
      before24h: Boolean(values.before24h),
      before2h: Boolean(values.before2h),
      afterTraining: Boolean(values.afterTraining),
    }
  }

  return { navigationForRole, normalizeFilters, sortTrainers, parsePanelHash, groupSlotsByDay, localDateKey, bookingSummary, shiftWeek, bookingActions, validateAvailabilityInput, validateTrainerPhoto, cleanMessage, preferencePayload }
})
