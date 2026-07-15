(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  root.RinoDomain = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  const transitions = {
    client: {
      pending: ['cancelled'],
      confirmed: ['cancelled'],
    },
    trainer: {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
    },
  }

  function localIso(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function createWeek(anchor = new Date()) {
    const anchorIso = typeof anchor === 'string' ? anchor.slice(0, 10) : localIso(anchor)
    const date = new Date(`${anchorIso}T12:00:00`)
    const offset = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - offset)
    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(date)
      item.setDate(date.getDate() + index)
      return {
        iso: localIso(item),
        day: item.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', ''),
        date: item.getDate(),
        month: item.toLocaleDateString('pl-PL', { month: 'short' }).replace('.', ''),
        isToday: localIso(item) === anchorIso,
      }
    })
  }

  function canTransitionBooking(from, to, role) {
    return Boolean(transitions[role]?.[from]?.includes(to))
  }

  function calculateEarnings(bookings) {
    return bookings
      .filter(item => item.status === 'completed' && item.paymentStatus === 'paid')
      .reduce((sum, item) => ({
        gross: sum.gross + item.price,
        fee: sum.fee + item.platformFee,
        payout: sum.payout + item.price - item.platformFee,
        count: sum.count + 1,
      }), { gross: 0, fee: 0, payout: 0, count: 0 })
  }

  function canReview(booking, existingReview) {
    return Boolean(booking && booking.status === 'completed' && booking.paymentStatus === 'paid' && !existingReview)
  }

  function slotsOverlap(first, second) {
    return new Date(first.startsAt) < new Date(second.endsAt) && new Date(second.startsAt) < new Date(first.endsAt)
  }

  function formatMoney(grosze) {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(grosze / 100)
  }

  return { createWeek, canTransitionBooking, calculateEarnings, canReview, slotsOverlap, formatMoney }
})
