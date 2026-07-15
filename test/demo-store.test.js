const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createDemoStore } = require('../lib/demo-store')

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

test('demo store signs in seeded client and restores the session', async () => {
  const store = createDemoStore(memoryStorage())
  const session = await store.signIn({ email: 'ania@demo.rinomove.pl', password: 'RinoDemo123' })

  assert.equal(session.user.role, 'client')
  assert.equal((await store.getSession()).user.email, 'ania@demo.rinomove.pl')
})

test('demo registration validates uniqueness and persists a trainer profile', async () => {
  const storage = memoryStorage()
  const store = createDemoStore(storage)
  const session = await store.signUp({
    fullName: 'Jan Trener',
    email: 'jan@example.pl',
    password: 'MocneHaslo123',
    role: 'trainer',
    acceptTerms: true,
  })

  assert.equal(session.user.role, 'trainer')
  await assert.rejects(() => store.signUp({
    fullName: 'Jan Trener', email: 'JAN@example.pl', password: 'MocneHaslo123', role: 'trainer', acceptTerms: true,
  }), /już istnieje/)
  assert.equal((await createDemoStore(storage).getSession()).user.id, session.user.id)
})

test('client booking reserves a slot and creates a conversation', async () => {
  const store = createDemoStore(memoryStorage())
  await store.signIn({ email: 'ania@demo.rinomove.pl', password: 'RinoDemo123' })
  const slots = await store.listAvailability('trainer-marek')
  const open = slots.find(slot => slot.status === 'available')
  const booking = await store.createBooking({ trainerId: 'trainer-marek', slotId: open.id })

  assert.equal(booking.status, 'confirmed')
  assert.equal(booking.paymentStatus, 'paid')
  assert.equal((await store.listAvailability('trainer-marek')).find(slot => slot.id === open.id).status, 'booked')
  assert.ok((await store.listConversations()).some(item => item.bookingId === booking.id))
  await assert.rejects(() => store.createBooking({ trainerId: 'trainer-marek', slotId: open.id }), /niedostępny/)

  await store.updateBookingStatus(booking.id, 'cancelled')
  const replacement = await store.createBooking({ trainerId: 'trainer-marek', slotId: open.id })
  assert.notEqual(replacement.id, booking.id)
})

test('fresh demo state only publishes future availability', async () => {
  const store = createDemoStore(memoryStorage())
  const slots = await store.listAvailability('trainer-marek')
  assert.ok(slots.some(slot => slot.status === 'available'))
  assert.ok(slots.filter(slot => slot.status === 'available').every(slot => new Date(slot.startsAt) > new Date()))
})

test('public trainer discovery never exposes contact details', async () => {
  const trainers = await createDemoStore(memoryStorage()).listTrainers()
  assert.ok(trainers.length > 0)
  assert.ok(trainers.every(trainer => !Object.hasOwn(trainer, 'email')))
})

test('message, preferences and trainer earnings mutations persist', async () => {
  const storage = memoryStorage()
  const clientStore = createDemoStore(storage)
  await clientStore.signIn({ email: 'ania@demo.rinomove.pl', password: 'RinoDemo123' })
  const conversation = (await clientStore.listConversations())[0]
  const message = await clientStore.sendMessage(conversation.id, '  Do zobaczenia!  ')
  await clientStore.savePreferences({ email: false, before24h: true })

  assert.equal(message.body, 'Do zobaczenia!')
  assert.equal((await clientStore.listMessages(conversation.id)).at(-1).id, message.id)
  assert.equal((await clientStore.getPreferences()).email, false)
  await clientStore.signOut()
  await clientStore.signIn({ email: 'marek@demo.rinomove.pl', password: 'RinoDemo123' })
  assert.equal((await clientStore.listConversations())[0].unread, true)
  await clientStore.markConversationRead(conversation.id)
  assert.equal((await clientStore.listConversations())[0].unread, false)

  await clientStore.signOut()
  await clientStore.signIn({ email: 'marek@demo.rinomove.pl', password: 'RinoDemo123' })
  const earnings = await clientStore.getEarnings()
  assert.ok(earnings.gross > 0)
  assert.equal(earnings.payout, earnings.gross - earnings.fee)
})

test('trainer can read their own profile before publication', async () => {
  const store = createDemoStore(memoryStorage())
  const session = await store.signUp({
    fullName: 'Nowa Trenerka', email: 'nowa@example.pl', password: 'MocneHaslo123', role: 'trainer', acceptTerms: true,
  })

  const profile = await store.getTrainerProfile()
  assert.equal(profile.id, session.user.id)
  assert.equal(profile.published, false)
})

test('completed booking reports whether the client already reviewed it', async () => {
  const store = createDemoStore(memoryStorage())
  await store.signIn({ email: 'ania@demo.rinomove.pl', password: 'RinoDemo123' })
  const completed = (await store.listBookings()).find(item => item.status === 'completed')
  assert.equal(completed.reviewed, false)

  await store.createReview({ bookingId: completed.id, rating: 5, body: 'Polecam' })
  assert.equal((await store.listBookings()).find(item => item.id === completed.id).reviewed, true)
})

test('trainer can add availability but overlapping slots are rejected', async () => {
  const store = createDemoStore(memoryStorage())
  await store.signIn({ email: 'marek@demo.rinomove.pl', password: 'RinoDemo123' })
  const slot = await store.setAvailability({ startsAt: '2026-07-20T09:00:00+02:00', endsAt: '2026-07-20T10:00:00+02:00' })

  assert.equal(slot.status, 'available')
  await assert.rejects(() => store.setAvailability({ startsAt: '2026-07-20T09:30:00+02:00', endsAt: '2026-07-20T10:30:00+02:00' }), /nakłada/)
  const past = new Date(Date.now() - 60_000)
  await assert.rejects(() => store.setAvailability({ startsAt: past.toISOString(), endsAt: new Date(past.getTime() + 3_600_000).toISOString() }), /przyszłości/)
})
