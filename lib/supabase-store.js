(function (root, factory) {
  const domain = typeof module === 'object' && module.exports ? require('./domain') : root.RinoDomain
  const api = factory(domain)
  if (typeof module === 'object' && module.exports) module.exports = api
  root.RinoSupabaseStore = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (domain) {
  'use strict'

  function createBrowserPendingAvatarStore(key) {
    const databaseName = 'rinomove-auth'
    const storeName = 'pending-avatars'

    function runIndexedDb(mode, createRequest) {
      return new Promise((resolve, reject) => {
        const openRequest = globalThis.indexedDB.open(databaseName, 1)
        openRequest.addEventListener('upgradeneeded', () => {
          if (!openRequest.result.objectStoreNames.contains(storeName)) openRequest.result.createObjectStore(storeName)
        }, { once: true })
        openRequest.addEventListener('error', () => reject(openRequest.error), { once: true })
        openRequest.addEventListener('success', () => {
          const database = openRequest.result
          const transaction = database.transaction(storeName, mode)
          const request = createRequest(transaction.objectStore(storeName))
          request.addEventListener('success', () => resolve(request.result), { once: true })
          request.addEventListener('error', () => reject(request.error), { once: true })
          transaction.addEventListener('complete', () => database.close(), { once: true })
          transaction.addEventListener('abort', () => database.close(), { once: true })
        }, { once: true })
      })
    }

    function fallbackStorage() {
      return globalThis.localStorage || globalThis.sessionStorage
    }

    return {
      async set(value) {
        try {
          if (globalThis.indexedDB) return await runIndexedDb('readwrite', store => store.put(value, key))
          const storage = fallbackStorage()
          if (!storage) throw new Error('persistent browser storage is unavailable')
          storage.setItem(key, JSON.stringify(value))
        } catch {
          throw new Error('Nie udało się bezpiecznie zapisać zdjęcia. Włącz pamięć witryn i spróbuj ponownie.')
        }
      },
      async get() {
        try {
          if (globalThis.indexedDB) return await runIndexedDb('readonly', store => store.get(key))
          return JSON.parse(fallbackStorage()?.getItem(key) || 'null')
        } catch { return null }
      },
      async remove() {
        try {
          if (globalThis.indexedDB) return await runIndexedDb('readwrite', store => store.delete(key))
          fallbackStorage()?.removeItem(key)
        } catch {}
      },
    }
  }

  function createSupabaseStore(client, options = {}) {
    const pendingAvatarKey = 'rino-pending-trainer-avatar'
    const pendingAvatarStore = options.pendingAvatarStore || createBrowserPendingAvatarStore(pendingAvatarKey)
    const fail = error => {
      if (error) throw new Error(error.message || 'Supabase nie mógł wykonać operacji.')
    }
    const userDto = (authUser, profile = {}) => ({
      id: authUser?.id || profile.id,
      email: authUser?.email || profile.email,
      fullName: profile.full_name || authUser?.user_metadata?.full_name || '',
      role: profile.role || authUser?.user_metadata?.role || 'client',
      avatarUrl: profile.avatar_url || null,
    })
    const trainerDto = row => ({
      id: row.user_id,
      name: row.profile?.full_name || 'Trener RinoMove',
      avatarUrl: row.profile?.avatar_url || null,
      bio: row.bio,
      disciplines: row.disciplines || [],
      district: row.district,
      hourlyRate: row.hourly_rate,
      verified: row.verified,
      published: row.published,
      rating: Number(row.rating || 0),
      reviewCount: row.review_count || 0,
      level: row.level,
    })
    const bookingDto = row => ({
      id: row.id,
      clientId: row.client_id,
      trainerId: row.trainer_id,
      slotId: row.slot_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      paymentStatus: row.payment_status,
      price: row.price,
      platformFee: row.platform_fee,
      location: row.location,
      createdAt: row.created_at,
      trainerName: row.trainer?.full_name,
      clientName: row.client?.full_name,
      reviewed: Boolean(row.reviews?.length),
    })
    const slotDto = row => ({ id: row.id, trainerId: row.trainer_id, startsAt: row.starts_at, endsAt: row.ends_at, status: row.status })
    const bookingSelect = 'id,client_id,trainer_id,slot_id,starts_at,ends_at,status,payment_status,price,platform_fee,location,created_at,trainer:profiles!bookings_trainer_id_fkey(full_name),client:profiles!bookings_client_id_fkey(full_name),reviews(id)'

    function dataUrlToBlob(value) {
      const match = String(value || '').match(/^data:(image\/(jpeg|png|webp));base64,([a-z0-9+/=]+)$/i)
      if (!match) throw new Error('Dodaj zdjęcie profilowe trenera.')
      const bytes = atob(match[3])
      const buffer = new Uint8Array(bytes.length)
      for (let index = 0; index < bytes.length; index += 1) buffer[index] = bytes.charCodeAt(index)
      return { blob: new Blob([buffer], { type: match[1].toLowerCase() }), extension: match[2].toLowerCase() === 'jpeg' ? 'jpg' : match[2].toLowerCase() }
    }

    async function uploadTrainerAvatar(userId, avatarDataUrl) {
      const { blob, extension } = dataUrlToBlob(avatarDataUrl)
      const objectPath = `${userId}/profile.${extension}`
      const { error } = await client.storage.from('trainer-avatars').upload(objectPath, blob, { upsert: true, contentType: blob.type })
      fail(error)
      const { data } = client.storage.from('trainer-avatars').getPublicUrl(objectPath)
      const avatarUrl = data.publicUrl
      const profileResult = await client.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
      fail(profileResult.error)
      return avatarUrl
    }

    async function savePendingAvatar(email, avatarDataUrl) {
      await pendingAvatarStore.set({ email, avatarDataUrl })
    }

    async function completePendingAvatar(user) {
      const pending = await pendingAvatarStore.get()
      if (!pending || pending.email !== user.email || user.role !== 'trainer') return null
      const avatarUrl = await uploadTrainerAvatar(user.id, pending.avatarDataUrl)
      await pendingAvatarStore.remove()
      return avatarUrl
    }

    async function currentUser() {
      const { data, error } = await client.auth.getUser()
      fail(error)
      if (!data.user) throw new Error('Zaloguj się, aby kontynuować.')
      const profileResult = await client.from('profiles').select('id,full_name,role,avatar_url').eq('id', data.user.id).single()
      fail(profileResult.error)
      return userDto(data.user, profileResult.data)
    }

    async function signUp(input) {
      const fullName = String(input.fullName || '').trim()
      const email = String(input.email || '').trim().toLowerCase()
      const password = String(input.password || '')
      if (fullName.length < 2 || fullName.length > 80) throw new Error('Podaj imię i nazwisko (2–80 znaków).')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Podaj prawidłowy adres e-mail.')
      if (password.length < 10 || !/\d/.test(password)) throw new Error('Hasło musi mieć co najmniej 10 znaków i cyfrę.')
      if (!['client', 'trainer'].includes(input.role)) throw new Error('Wybierz typ konta.')
      if (!input.acceptTerms) throw new Error('Zaakceptuj regulamin i politykę prywatności.')
      if (input.role === 'trainer' && !/^data:image\/(?:jpeg|png|webp);base64,/i.test(String(input.avatarDataUrl || ''))) throw new Error('Dodaj zdjęcie profilowe trenera.')
      if (input.role === 'trainer') await savePendingAvatar(email, input.avatarDataUrl)
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: input.role, accepted_terms_at: new Date().toISOString() } },
      })
      fail(error)
      const user = userDto(data.user)
      if (input.role === 'trainer' && data.session) user.avatarUrl = await completePendingAvatar(user)
      return { user, needsConfirmation: !data.session }
    }

    async function signIn(input) {
      const { data, error } = await client.auth.signInWithPassword({ email: String(input.email || '').trim().toLowerCase(), password: input.password })
      fail(error)
      const profile = await currentUser()
      profile.avatarUrl = await completePendingAvatar(profile) || profile.avatarUrl
      return { user: profile, session: data.session }
    }

    async function signOut() {
      const { error } = await client.auth.signOut()
      fail(error)
    }

    async function getSession() {
      const { data, error } = await client.auth.getUser()
      if (error || !data.user) return null
      const result = await client.from('profiles').select('id,full_name,role,avatar_url').eq('id', data.user.id).maybeSingle()
      if (result.error || !result.data) return null
      const user = userDto(data.user, result.data)
      user.avatarUrl = await completePendingAvatar(user) || user.avatarUrl
      return { user }
    }

    async function listTrainers(filters = {}) {
      let query = client.from('trainer_profiles').select('user_id,bio,disciplines,district,hourly_rate,verified,published,rating,review_count,level,profile:profiles!trainer_profiles_user_id_fkey(full_name,avatar_url)').eq('published', true)
      if (filters.discipline) query = query.contains('disciplines', [filters.discipline])
      if (filters.district) query = query.eq('district', filters.district)
      if (filters.maxPrice) query = query.lte('hourly_rate', Number(filters.maxPrice))
      const { data, error } = await query.order('rating', { ascending: false })
      fail(error)
      const q = String(filters.q || '').trim().toLocaleLowerCase('pl')
      return (data || []).map(trainerDto).filter(trainer => !q || `${trainer.name} ${trainer.disciplines.join(' ')} ${trainer.district} ${trainer.level}`.toLocaleLowerCase('pl').includes(q))
    }

    async function listAvailability(trainerId, range = {}) {
      let query = client.from('availability_slots').select('id,trainer_id,starts_at,ends_at,status').eq('trainer_id', trainerId)
      if (range.from) query = query.gte('starts_at', range.from)
      if (range.to) query = query.lt('starts_at', range.to)
      const { data, error } = await query.order('starts_at')
      fail(error)
      return (data || []).map(slotDto)
    }

    async function createBooking({ slotId }) {
      const { data, error } = await client.from('bookings').insert({ slot_id: slotId }).select(bookingSelect).single()
      fail(error)
      return bookingDto(data)
    }

    async function listBookings() {
      const { data, error } = await client.from('bookings').select(bookingSelect).order('starts_at', { ascending: false })
      fail(error)
      return (data || []).map(bookingDto)
    }

    async function updateBookingStatus(id, status) {
      const { data, error } = await client.from('bookings').update({ status }).eq('id', id).select(bookingSelect).single()
      fail(error)
      return bookingDto(data)
    }

    async function listConversations() {
      const user = await currentUser()
      const membership = await client.from('conversation_members').select('conversation_id,conversation:conversations(id,booking_id,created_at)').eq('user_id', user.id)
      fail(membership.error)
      const items = []
      for (const row of membership.data || []) {
        const members = await client.from('conversation_members').select('user_id,profile:profiles!conversation_members_user_id_fkey(id,full_name,role)').eq('conversation_id', row.conversation_id)
        fail(members.error)
        const messages = await client.from('messages').select('id,conversation_id,sender_id,body,created_at,read_at').eq('conversation_id', row.conversation_id).order('created_at', { ascending: false }).limit(1)
        fail(messages.error)
        const other = members.data?.find(item => item.user_id !== user.id)?.profile
        const lastMessage = messages.data?.[0] || null
        items.push({ id: row.conversation.id, bookingId: row.conversation.booking_id, createdAt: row.conversation.created_at, other: other ? userDto(null, other) : null, lastMessage, unread: Boolean(lastMessage && lastMessage.sender_id !== user.id && !lastMessage.read_at) })
      }
      return items.sort((a, b) => String(b.lastMessage?.created_at || b.createdAt).localeCompare(String(a.lastMessage?.created_at || a.createdAt)))
    }

    async function listMessages(conversationId) {
      const { data, error } = await client.from('messages').select('id,conversation_id,sender_id,body,created_at,read_at').eq('conversation_id', conversationId).order('created_at')
      fail(error)
      return (data || []).map(row => ({ id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, body: row.body, createdAt: row.created_at, readAt: row.read_at }))
    }

    async function sendMessage(conversationId, value) {
      const user = await currentUser()
      const body = String(value || '').trim()
      if (!body) throw new Error('Wiadomość nie może być pusta.')
      const { data, error } = await client.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, body }).select('id,conversation_id,sender_id,body,created_at').single()
      fail(error)
      return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, body: data.body, createdAt: data.created_at }
    }

    async function markConversationRead(conversationId) {
      const user = await currentUser()
      const { error } = await client.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', user.id).is('read_at', null)
      fail(error)
    }

    async function setAvailability(input) {
      const user = await currentUser()
      if (user.role !== 'trainer') throw new Error('Ta akcja jest dostępna tylko dla trenera.')
      const { data, error } = await client.from('availability_slots').insert({ trainer_id: user.id, starts_at: input.startsAt, ends_at: input.endsAt, status: input.status === 'blocked' ? 'blocked' : 'available' }).select('id,trainer_id,starts_at,ends_at,status').single()
      fail(error)
      return slotDto(data)
    }

    async function getEarnings() {
      const bookings = await listBookings()
      const totals = domain.calculateEarnings(bookings)
      return { ...totals, transactions: bookings.filter(item => item.status === 'completed' && item.paymentStatus === 'paid') }
    }

    async function getPreferences() {
      const user = await currentUser()
      const { data, error } = await client.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle()
      fail(error)
      return data ? { userId: data.user_id, email: data.email, sms: data.sms, push: data.push, before24h: data.before_24h, before2h: data.before_2h, afterTraining: data.after_training } : { userId: user.id, email: true, sms: false, push: false, before24h: true, before2h: true, afterTraining: false }
    }

    async function savePreferences(values) {
      const user = await currentUser()
      const row = { user_id: user.id, email: values.email, sms: values.sms, push: values.push, before_24h: values.before24h, before_2h: values.before2h, after_training: values.afterTraining }
      const { error } = await client.from('notification_preferences').upsert(row, { onConflict: 'user_id' })
      fail(error)
      return getPreferences()
    }

    async function getTrainerProfile() {
      const user = await currentUser()
      if (user.role !== 'trainer') throw new Error('Ta akcja jest dostępna tylko dla trenera.')
      const { data, error } = await client.from('trainer_profiles').select('user_id,bio,disciplines,district,hourly_rate,verified,published,rating,review_count,level,profile:profiles!trainer_profiles_user_id_fkey(full_name,avatar_url)').eq('user_id', user.id).single()
      fail(error)
      return trainerDto(data)
    }

    async function saveTrainerProfile(values) {
      const user = await currentUser()
      if (user.role !== 'trainer') throw new Error('Ta akcja jest dostępna tylko dla trenera.')
      const row = { bio: values.bio, disciplines: values.disciplines, district: values.district, hourly_rate: values.hourlyRate, published: values.published }
      const { data, error } = await client.from('trainer_profiles').update(row).eq('user_id', user.id).select('user_id,bio,disciplines,district,hourly_rate,verified,published,rating,review_count,level,profile:profiles!trainer_profiles_user_id_fkey(full_name,avatar_url)').single()
      fail(error)
      return trainerDto(data)
    }

    async function listClients() {
      const bookings = await listBookings()
      const ids = [...new Set(bookings.map(item => item.clientId))]
      if (!ids.length) return []
      const { data, error } = await client.from('profiles').select('id,full_name,role').in('id', ids)
      fail(error)
      return (data || []).map(profile => {
        const related = bookings.filter(item => item.clientId === profile.id)
        return { ...userDto(null, profile), bookingCount: related.length, completedCount: related.filter(item => item.status === 'completed').length, lastTrainingAt: related.map(item => item.startsAt).filter(Boolean).sort().at(-1) || null }
      })
    }

    async function createReview(input) {
      const user = await currentUser()
      const { data, error } = await client.from('reviews').insert({ booking_id: input.bookingId, client_id: user.id, rating: Number(input.rating), body: String(input.body || '').trim() }).select('id,booking_id,client_id,trainer_id,rating,body,created_at').single()
      fail(error)
      return { id: data.id, bookingId: data.booking_id, clientId: data.client_id, trainerId: data.trainer_id, rating: data.rating, body: data.body, createdAt: data.created_at }
    }

    async function getDashboard() {
      const user = await currentUser()
      const bookings = await listBookings()
      const nextBooking = bookings.filter(item => item.status === 'confirmed').sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)))[0] || null
      if (user.role === 'trainer') return { role: user.role, nextBooking, pendingCount: bookings.filter(item => item.status === 'pending').length, clientCount: (await listClients()).length, earnings: await getEarnings() }
      return { role: user.role, nextBooking, bookingCount: bookings.length }
    }

    function subscribeToMessages(conversationId, callback) {
      const channel = client.channel(`conversation:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => callback(payload.new)).subscribe()
      return () => client.removeChannel(channel)
    }

    return {
      mode: 'supabase', signUp, signIn, signOut, getSession, getDashboard, listTrainers,
      listAvailability, createBooking, listBookings, updateBookingStatus, listConversations,
      listMessages, sendMessage, markConversationRead, setAvailability, getEarnings, getPreferences, savePreferences,
      getTrainerProfile, saveTrainerProfile, listClients, createReview, subscribeToMessages,
    }
  }

  return { createSupabaseStore }
})
