(function (root, factory) {
  const domain = typeof module === 'object' && module.exports ? require('./domain') : root.RinoDomain
  const api = factory(domain)
  if (typeof module === 'object' && module.exports) module.exports = api
  root.RinoDemoStore = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (domain) {
  'use strict'

  const STORAGE_KEY = 'rino-demo-v1'
  const DEMO_PASSWORD = 'RinoDemo123'

  function relativeIso(days, hour, minute = 0) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
  }

  function seedState() {
    const seededAt = new Date().toISOString()
    const completedStart = relativeIso(-5, 18)
    const completedEnd = relativeIso(-5, 19)
    return {
      version: 4,
      sessionUserId: null,
      users: [
        { id: 'client-ania', fullName: 'Ania Nowak', email: 'ania@demo.rinomove.pl', password: DEMO_PASSWORD, role: 'client', createdAt: seededAt },
        { id: 'trainer-marek', fullName: 'Marek Kowalski', email: 'marek@demo.rinomove.pl', password: DEMO_PASSWORD, role: 'trainer', createdAt: seededAt },
        { id: 'trainer-julia', fullName: 'Julia Nowak', email: 'julia@demo.rinomove.pl', password: DEMO_PASSWORD, role: 'trainer', createdAt: seededAt },
        { id: 'trainer-pawel', fullName: 'Paweł Wrona', email: 'pawel@demo.rinomove.pl', password: DEMO_PASSWORD, role: 'trainer', createdAt: seededAt },
        { id: 'trainer-anna', fullName: 'Anna Sowa', email: 'anna@demo.rinomove.pl', password: DEMO_PASSWORD, role: 'trainer', createdAt: seededAt },
      ],
      trainerProfiles: [
        {
          userId: 'trainer-marek', bio: 'Trener tenisa z 12-letnim doświadczeniem. Spokojnie wprowadzam dorosłych i juniorów w grę, tłumacząc technikę w prosty i praktyczny sposób.',
          city: 'Warszawa', district: 'Śródmieście', disciplines: ['tenis'], hourlyRate: 22000, verified: true, published: true, rating: 4.9, reviewCount: 38, level: 'Każdy poziom',
          experience: 'Od 12 lat prowadzę treningi indywidualne i grupowe. Pracowałem z osobami zaczynającymi od zera, amatorami ligowymi oraz juniorami.',
          specialties: ['Technika od podstaw', 'Serwis i return', 'Przygotowanie do ligi'],
          gallery: [
            { url: 'assets/trainer-tennis-editorial.png', alt: 'Trener tenisa podczas treningu na korcie', order: 0, isCover: true },
            { url: 'assets/tennis-back-serve.png', alt: 'Ćwiczenie serwisu tenisowego', order: 1, isCover: false },
            { url: 'assets/trainer-landing-tennis-back-serve.png', alt: 'Indywidualna lekcja tenisa', order: 2, isCover: false },
          ],
        },
        {
          userId: 'trainer-julia', bio: 'Treningi tenisa dla dzieci, juniorów i osób wracających do sportu. Buduję pewność na korcie bez niepotrzebnej presji.',
          city: 'Warszawa', district: 'Mokotów', disciplines: ['tenis'], hourlyRate: 19000, verified: true, published: true, rating: 4.8, reviewCount: 24, level: 'Dzieci i juniorzy',
          experience: 'Prowadzę zajęcia tenisowe od 8 lat, w tym programy dla dzieci i spokojne treningi powrotne dla dorosłych po dłuższej przerwie.',
          specialties: ['Dzieci i juniorzy', 'Powrót do sportu', 'Koordynacja ruchowa'],
          gallery: [
            { url: 'assets/trainer-tennis-editorial.png', alt: 'Trening tenisowy na warszawskim korcie', order: 0, isCover: true },
            { url: 'assets/trainer-landing-tennis-back-serve.png', alt: 'Ćwiczenia techniczne podczas lekcji tenisa', order: 1, isCover: false },
          ],
        },
        {
          userId: 'trainer-pawel', bio: 'Boks od podstaw bez presji. Uczę techniki, pracy nóg i bezpiecznego budowania kondycji w tempie dopasowanym do ćwiczącego.',
          city: 'Warszawa', district: 'Wola', disciplines: ['boks'], hourlyRate: 18000, verified: true, published: true, rating: 5, reviewCount: 19, level: 'Początkujący',
          experience: 'Od 9 lat trenuję boks i przygotowanie motoryczne. Prowadzę przede wszystkim osoby początkujące oraz treningi kondycyjne bez sparingów.',
          specialties: ['Boks od podstaw', 'Praca nóg', 'Kondycja bez sparingów'],
          gallery: [
            { url: 'assets/trainer-boxing-editorial.png', alt: 'Trener boksu podczas treningu technicznego', order: 0, isCover: true },
            { url: 'assets/trainer-boxing-editorial.png', alt: 'Ćwiczenie pozycji i pracy nóg w boksie', order: 1, isCover: false },
          ],
        },
        {
          userId: 'trainer-anna', bio: 'Padel dla początkujących i średniozaawansowanych na Wilanowie. Na zajęciach łączę technikę z dużą liczbą praktycznych wymian.',
          city: 'Warszawa', district: 'Wilanów', disciplines: ['padel'], hourlyRate: 24000, verified: true, published: true, rating: 4.9, reviewCount: 31, level: 'Każdy poziom',
          experience: 'Prowadzę sporty rakietowe od 10 lat, a od 5 lat specjalizuję się w padlu dla osób dorosłych i par przygotowujących się do turniejów.',
          specialties: ['Padel od podstaw', 'Gra przy siatce', 'Taktyka par'],
          gallery: [
            { url: 'assets/tennis-back-serve.png', alt: 'Trening sportu rakietowego na korcie', order: 0, isCover: true },
            { url: 'assets/trainer-tennis-editorial.png', alt: 'Indywidualne wskazówki techniczne na korcie', order: 1, isCover: false },
          ],
        },
      ],
      slots: [
        { id: 'slot-m-1', trainerId: 'trainer-marek', startsAt: relativeIso(1, 9), endsAt: relativeIso(1, 10), status: 'available' },
        { id: 'slot-m-2', trainerId: 'trainer-marek', startsAt: relativeIso(1, 17, 30), endsAt: relativeIso(1, 18, 30), status: 'available' },
        { id: 'slot-m-3', trainerId: 'trainer-marek', startsAt: relativeIso(3, 10), endsAt: relativeIso(3, 11), status: 'booked' },
        { id: 'slot-j-1', trainerId: 'trainer-julia', startsAt: relativeIso(2, 16), endsAt: relativeIso(2, 17), status: 'available' },
        { id: 'slot-p-1', trainerId: 'trainer-pawel', startsAt: relativeIso(2, 18, 30), endsAt: relativeIso(2, 19, 30), status: 'available' },
        { id: 'slot-a-1', trainerId: 'trainer-anna', startsAt: relativeIso(3, 12), endsAt: relativeIso(3, 13), status: 'available' },
      ],
      bookings: [
        { id: 'booking-upcoming', clientId: 'client-ania', trainerId: 'trainer-marek', slotId: 'slot-m-3', status: 'confirmed', paymentStatus: 'paid', price: 22000, platformFee: 2200, location: 'Korty Legia, Warszawa', createdAt: relativeIso(-3, 12) },
        { id: 'booking-completed', clientId: 'client-ania', trainerId: 'trainer-marek', slotId: null, startsAt: completedStart, endsAt: completedEnd, status: 'completed', paymentStatus: 'paid', price: 22000, platformFee: 2200, location: 'Korty Legia, Warszawa', createdAt: relativeIso(-7, 12) },
      ],
      conversations: [
        { id: 'conversation-1', bookingId: 'booking-upcoming', memberIds: ['client-ania', 'trainer-marek'], createdAt: relativeIso(-3, 12, 1) },
      ],
      messages: [
        { id: 'message-1', conversationId: 'conversation-1', senderId: 'trainer-marek', body: 'Cześć Aniu! Kort 3 przy Myśliwieckiej będzie gotowy. Do zobaczenia!', createdAt: relativeIso(-1, 10, 24) },
        { id: 'message-2', conversationId: 'conversation-1', senderId: 'client-ania', body: 'Super, będę 10 minut wcześniej.', createdAt: relativeIso(-1, 10, 27) },
      ],
      preferences: [
        { userId: 'client-ania', email: true, sms: true, push: false, before24h: true, before2h: true, afterTraining: false },
        { userId: 'trainer-marek', email: true, sms: false, push: true, before24h: true, before2h: true, afterTraining: true },
      ],
      reviews: [
        { id: 'review-public-m-1', bookingId: null, clientId: null, trainerId: 'trainer-marek', rating: 5, body: 'Spokojne tłumaczenie i bardzo konkretne wskazówki. Po pierwszym treningu wiedziałam, nad czym pracować.', authorName: 'Katarzyna L.', createdAt: relativeIso(-18, 12) },
        { id: 'review-public-m-2', bookingId: null, clientId: null, trainerId: 'trainer-marek', rating: 5, body: 'Świetnie dobrane ćwiczenia i dużo uwagi poświęconej serwisowi. Zdecydowanie wrócę.', authorName: 'Tomasz P.', createdAt: relativeIso(-31, 18) },
        { id: 'review-public-j-1', bookingId: null, clientId: null, trainerId: 'trainer-julia', rating: 5, body: 'Córka wyszła z treningu uśmiechnięta i od razu chciała zapisać się na kolejne zajęcia.', authorName: 'Monika S.', createdAt: relativeIso(-12, 16) },
        { id: 'review-public-j-2', bookingId: null, clientId: null, trainerId: 'trainer-julia', rating: 4, body: 'Bardzo dobre podejście do dziecka i jasne podsumowanie po treningu.', authorName: 'Adam K.', createdAt: relativeIso(-27, 13) },
        { id: 'review-public-p-1', bookingId: null, clientId: null, trainerId: 'trainer-pawel', rating: 5, body: 'Pierwszy boks bez stresu. Paweł pilnuje techniki i tłumaczy każdy ruch.', authorName: 'Michał W.', createdAt: relativeIso(-9, 19) },
        { id: 'review-public-p-2', bookingId: null, clientId: null, trainerId: 'trainer-pawel', rating: 5, body: 'Intensywnie, ale bezpiecznie. Dokładnie takiego treningu szukałam.', authorName: 'Ewa D.', createdAt: relativeIso(-22, 10) },
        { id: 'review-public-a-1', bookingId: null, clientId: null, trainerId: 'trainer-anna', rating: 5, body: 'Anna szybko wyłapała nasze błędy i przełożyła je na proste ćwiczenia.', authorName: 'Natalia B.', createdAt: relativeIso(-14, 17) },
        { id: 'review-public-a-2', bookingId: null, clientId: null, trainerId: 'trainer-anna', rating: 5, body: 'Dużo gry, konkretna informacja zwrotna i świetna atmosfera na korcie.', authorName: 'Robert M.', createdAt: relativeIso(-29, 9) },
      ],
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function makeId(prefix) {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
    return `${prefix}-${id}`
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase()
  }

  function publicUser(user) {
    if (!user) return null
    const { password, ...safe } = user
    return safe
  }

  function createDemoStore(storage = globalThis.localStorage) {
    let state
    try {
      state = JSON.parse(storage.getItem(STORAGE_KEY))
    } catch {}
    if (!state || state.version !== 4) state = seedState()

    const persist = () => storage.setItem(STORAGE_KEY, JSON.stringify(state))
    const currentUser = () => state.users.find(user => user.id === state.sessionUserId) || null
    const requireUser = role => {
      const user = currentUser()
      if (!user) throw new Error('Zaloguj się, aby kontynuować.')
      if (role && user.role !== role) throw new Error('Ta akcja nie jest dostępna dla tego konta.')
      return user
    }
    const trainerDto = profile => {
      const user = state.users.find(item => item.id === profile.userId)
      return { id: profile.userId, name: user.fullName, avatarUrl: user.avatarUrl || null, ...clone(profile) }
    }
    const bookingDto = booking => {
      const trainer = state.users.find(item => item.id === booking.trainerId)
      const client = state.users.find(item => item.id === booking.clientId)
      const slot = state.slots.find(item => item.id === booking.slotId)
      return { ...clone(booking), startsAt: booking.startsAt || slot?.startsAt, endsAt: booking.endsAt || slot?.endsAt, trainerName: trainer?.fullName, clientName: client?.fullName, reviewed: state.reviews.some(review => review.bookingId === booking.id) }
    }

    async function signUp(input) {
      const fullName = String(input.fullName || '').trim()
      const email = normalizeEmail(input.email)
      const password = String(input.password || '')
      if (fullName.length < 2 || fullName.length > 80) throw new Error('Podaj imię i nazwisko (2–80 znaków).')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Podaj prawidłowy adres e-mail.')
      if (password.length < 10 || !/\d/.test(password)) throw new Error('Hasło musi mieć co najmniej 10 znaków i cyfrę.')
      if (!['client', 'trainer'].includes(input.role)) throw new Error('Wybierz typ konta.')
      if (!input.acceptTerms) throw new Error('Zaakceptuj regulamin i politykę prywatności.')
      if (input.role === 'trainer' && !/^data:image\/(?:jpeg|png|webp);base64,/i.test(String(input.avatarDataUrl || ''))) throw new Error('Dodaj zdjęcie profilowe trenera.')
      if (state.users.some(user => user.email === email)) throw new Error('Konto z tym adresem już istnieje.')
      const user = { id: makeId(input.role), fullName, email, password, role: input.role, avatarUrl: input.role === 'trainer' ? input.avatarDataUrl : null, createdAt: new Date().toISOString() }
      state.users.push(user)
      if (user.role === 'trainer') state.trainerProfiles.push({ userId: user.id, bio: '', city: 'Warszawa', disciplines: ['tenis'], district: 'Warszawa', hourlyRate: 18000, verified: false, published: false, rating: 0, reviewCount: 0, level: 'Nowy profil', experience: '', specialties: [], gallery: [] })
      state.preferences.push({ userId: user.id, email: true, sms: false, push: false, before24h: true, before2h: true, afterTraining: user.role === 'trainer' })
      state.sessionUserId = user.id
      persist()
      return { user: publicUser(user) }
    }

    async function signIn(input) {
      const user = state.users.find(item => item.email === normalizeEmail(input.email) && item.password === String(input.password || ''))
      if (!user) throw new Error('Nieprawidłowy e-mail lub hasło.')
      state.sessionUserId = user.id
      persist()
      return { user: publicUser(user) }
    }

    async function signOut() {
      state.sessionUserId = null
      persist()
    }

    async function getSession() {
      const user = currentUser()
      return user ? { user: publicUser(user) } : null
    }

    async function listTrainers(filters = {}) {
      const q = String(filters.q || '').trim().toLocaleLowerCase('pl')
      return state.trainerProfiles.filter(profile => profile.published).map(trainerDto).filter(trainer => {
        const name = trainer.name.toLocaleLowerCase('pl')
        return (!filters.city || trainer.city === filters.city)
          && (!filters.district || trainer.district === filters.district)
          && (!filters.discipline || trainer.disciplines.includes(filters.discipline))
          && (!q || name.includes(q))
      })
    }

    async function getPublicTrainer(id) {
      const profile = state.trainerProfiles.find(item => item.userId === id && item.published)
      return profile ? trainerDto(profile) : null
    }

    async function listTrainerReviews(id) {
      const profile = state.trainerProfiles.find(item => item.userId === id && item.published)
      if (!profile) return []
      return clone(state.reviews.filter(item => item.trainerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(item => ({
        id: item.id, trainerId: item.trainerId, rating: item.rating, body: item.body,
        authorName: item.authorName || `${state.users.find(user => user.id === item.clientId)?.fullName?.split(' ')[0] || 'Klient'} R.`,
        createdAt: item.createdAt,
      })))
    }

    async function listAvailability(trainerId, range = {}) {
      return clone(state.slots.filter(slot => slot.trainerId === trainerId && (!range.from || slot.startsAt >= range.from) && (!range.to || slot.startsAt < range.to)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
    }

    async function createBooking({ trainerId, slotId }) {
      const user = requireUser('client')
      const slot = state.slots.find(item => item.id === slotId && item.trainerId === trainerId)
      if (!slot || slot.status !== 'available') throw new Error('Ten termin jest już niedostępny.')
      if (new Date(slot.startsAt) <= new Date()) throw new Error('Nie można zarezerwować terminu z przeszłości.')
      const trainer = state.trainerProfiles.find(item => item.userId === trainerId && item.published)
      if (!trainer) throw new Error('Profil trenera nie jest dostępny.')
      const booking = { id: makeId('booking'), clientId: user.id, trainerId, slotId, status: 'confirmed', paymentStatus: 'paid', price: trainer.hourlyRate, platformFee: Math.round(trainer.hourlyRate * 0.1), location: `${trainer.district}, Warszawa`, createdAt: new Date().toISOString() }
      slot.status = 'booked'
      state.bookings.push(booking)
      state.conversations.push({ id: makeId('conversation'), bookingId: booking.id, memberIds: [user.id, trainerId], createdAt: new Date().toISOString() })
      persist()
      return bookingDto(booking)
    }

    async function listBookings() {
      const user = requireUser()
      return state.bookings.filter(item => user.role === 'trainer' ? item.trainerId === user.id : item.clientId === user.id).map(bookingDto).sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)))
    }

    async function updateBookingStatus(id, status) {
      const user = requireUser()
      const booking = state.bookings.find(item => item.id === id && (user.role === 'trainer' ? item.trainerId === user.id : item.clientId === user.id))
      if (!booking || !domain.canTransitionBooking(booking.status, status, user.role)) throw new Error('Ta zmiana statusu nie jest dozwolona.')
      booking.status = status
      if (status === 'cancelled' && booking.slotId) {
        const slot = state.slots.find(item => item.id === booking.slotId)
        if (slot) slot.status = 'available'
      }
      persist()
      return bookingDto(booking)
    }

    async function listConversations() {
      const user = requireUser()
      return clone(state.conversations.filter(item => item.memberIds.includes(user.id)).map(item => {
        const otherId = item.memberIds.find(id => id !== user.id)
        const other = state.users.find(person => person.id === otherId)
        const messages = state.messages.filter(message => message.conversationId === item.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        const lastMessage = messages.at(-1) || null
        return { ...item, other: publicUser(other), lastMessage, unread: Boolean(lastMessage && lastMessage.senderId !== user.id && !lastMessage.readAt) }
      }))
    }

    function requireConversation(id) {
      const user = requireUser()
      const conversation = state.conversations.find(item => item.id === id && item.memberIds.includes(user.id))
      if (!conversation) throw new Error('Nie masz dostępu do tej rozmowy.')
      return { user, conversation }
    }

    async function listMessages(conversationId) {
      requireConversation(conversationId)
      return clone(state.messages.filter(item => item.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
    }

    async function sendMessage(conversationId, value) {
      const { user } = requireConversation(conversationId)
      const body = String(value || '').trim()
      if (!body) throw new Error('Wiadomość nie może być pusta.')
      if (body.length > 2000) throw new Error('Wiadomość może mieć najwyżej 2000 znaków.')
      const message = { id: makeId('message'), conversationId, senderId: user.id, body, createdAt: new Date().toISOString() }
      state.messages.push(message)
      persist()
      return clone(message)
    }

    async function markConversationRead(conversationId) {
      const { user } = requireConversation(conversationId)
      const readAt = new Date().toISOString()
      state.messages.filter(item => item.conversationId === conversationId && item.senderId !== user.id && !item.readAt).forEach(item => { item.readAt = readAt })
      persist()
    }

    async function setAvailability(input) {
      const user = requireUser('trainer')
      const startsAt = new Date(input.startsAt)
      const endsAt = new Date(input.endsAt)
      if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || startsAt >= endsAt) throw new Error('Podaj prawidłowy początek i koniec terminu.')
      if (startsAt <= new Date()) throw new Error('Termin musi zaczynać się w przyszłości.')
      const candidate = { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }
      if (state.slots.some(slot => slot.trainerId === user.id && slot.status !== 'cancelled' && domain.slotsOverlap(slot, candidate))) throw new Error('Ten termin nakłada się na istniejącą dostępność.')
      const slot = { id: makeId('slot'), trainerId: user.id, ...candidate, status: input.status === 'blocked' ? 'blocked' : 'available' }
      state.slots.push(slot)
      persist()
      return clone(slot)
    }

    async function getEarnings() {
      const user = requireUser('trainer')
      const bookings = state.bookings.filter(item => item.trainerId === user.id)
      return { ...domain.calculateEarnings(bookings), transactions: bookings.filter(item => item.status === 'completed' && item.paymentStatus === 'paid').map(bookingDto) }
    }

    async function getPreferences() {
      const user = requireUser()
      return clone(state.preferences.find(item => item.userId === user.id) || { userId: user.id, email: true, sms: false, push: false, before24h: true, before2h: true, afterTraining: false })
    }

    async function savePreferences(values) {
      const user = requireUser()
      let preferences = state.preferences.find(item => item.userId === user.id)
      if (!preferences) {
        preferences = { userId: user.id }
        state.preferences.push(preferences)
      }
      Object.assign(preferences, values, { userId: user.id })
      persist()
      return clone(preferences)
    }

    async function getTrainerProfile() {
      const user = requireUser('trainer')
      const profile = state.trainerProfiles.find(item => item.userId === user.id)
      if (!profile) throw new Error('Nie znaleziono profilu trenera.')
      return trainerDto(profile)
    }

    async function saveTrainerProfile(values) {
      const user = requireUser('trainer')
      const profile = state.trainerProfiles.find(item => item.userId === user.id)
      if (!profile) throw new Error('Nie znaleziono profilu trenera.')
      const allowed = ['bio', 'disciplines', 'district', 'hourlyRate', 'published']
      for (const key of allowed) if (key in values) profile[key] = values[key]
      persist()
      return trainerDto(profile)
    }

    async function listClients() {
      const user = requireUser('trainer')
      const ids = [...new Set(state.bookings.filter(item => item.trainerId === user.id).map(item => item.clientId))]
      return ids.map(id => {
        const client = state.users.find(item => item.id === id)
        const bookings = state.bookings.filter(item => item.trainerId === user.id && item.clientId === id)
        return { ...publicUser(client), bookingCount: bookings.length, completedCount: bookings.filter(item => item.status === 'completed').length, lastTrainingAt: bookings.map(bookingDto).map(item => item.startsAt).filter(Boolean).sort().at(-1) || null }
      })
    }

    async function createReview({ bookingId, rating, body }) {
      const user = requireUser('client')
      const booking = state.bookings.find(item => item.id === bookingId && item.clientId === user.id)
      const existing = state.reviews.find(item => item.bookingId === bookingId)
      if (!domain.canReview(booking, existing)) throw new Error('Ta rezerwacja nie może zostać oceniona.')
      const numericRating = Number(rating)
      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) throw new Error('Ocena musi być liczbą od 1 do 5.')
      const review = { id: makeId('review'), bookingId, clientId: user.id, trainerId: booking.trainerId, rating: numericRating, body: String(body || '').trim(), createdAt: new Date().toISOString() }
      state.reviews.push(review)
      persist()
      return clone(review)
    }

    async function getDashboard() {
      const user = requireUser()
      const bookings = await listBookings()
      if (user.role === 'trainer') {
        const earnings = await getEarnings()
        return { role: user.role, nextBooking: bookings.filter(item => item.status === 'confirmed').sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] || null, pendingCount: bookings.filter(item => item.status === 'pending').length, clientCount: (await listClients()).length, earnings }
      }
      return { role: user.role, nextBooking: bookings.filter(item => item.status === 'confirmed').sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] || null, bookingCount: bookings.length }
    }

    function reset() {
      state = seedState()
      persist()
    }

    persist()
    return {
      mode: 'demo',
      demoAccounts: [
        { role: 'client', email: 'ania@demo.rinomove.pl', password: DEMO_PASSWORD },
        { role: 'trainer', email: 'marek@demo.rinomove.pl', password: DEMO_PASSWORD },
      ],
      signUp, signIn, signOut, getSession, getDashboard, listTrainers, getPublicTrainer, listTrainerReviews, listAvailability, createBooking,
      listBookings, updateBookingStatus, listConversations, listMessages, sendMessage, markConversationRead, setAvailability,
      getEarnings, getPreferences, savePreferences, getTrainerProfile, saveTrainerProfile, listClients, createReview, reset,
    }
  }

  return { createDemoStore, seedState }
})
