(function () {
  'use strict'

  const $ = selector => document.querySelector(selector)
  const $$ = selector => [...document.querySelectorAll(selector)]
  const helpers = window.RinoPanelHelpers
  const domain = window.RinoDomain
  const state = {
    store: null,
    user: null,
    route: 'discover',
    authMode: 'login',
    selectedTrainer: null,
    bookingFlowActive: false,
    trainerPhotoDataUrl: null,
    selectedSlot: null,
    resumeBooking: false,
    selectedDate: null,
    weekAnchor: null,
    slots: [],
    conversations: [],
    selectedConversation: null,
    bookingFilter: 'all',
    unsubscribeMessages: null,
    messagePoll: null,
  }

  const labels = {
    pending: 'Oczekuje',
    confirmed: 'Potwierdzona',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    available: 'Dostępny',
    blocked: 'Zablokowany',
    booked: 'Zarezerwowany',
  }

  function element(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('aria-hidden', 'true')
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    use.setAttribute('href', `#icon-${name}`)
    svg.appendChild(use)
    return svg
  }

  function initials(name) {
    return String(name || 'Rino Move').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  }

  function applyAvatar(node, url, name) {
    const hasPhoto = Boolean(url)
    node.classList.toggle('has-photo', hasPhoto)
    node.style.backgroundImage = hasPhoto ? `url("${String(url).replaceAll('"', '%22')}")` : ''
    node.textContent = hasPhoto ? '' : initials(name)
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(reader.result), { once: true })
      reader.addEventListener('error', () => reject(new Error('Nie udało się odczytać zdjęcia.')), { once: true })
      reader.readAsDataURL(file)
    })
  }

  async function prepareTrainerPhoto(file) {
    const source = await readFileAsDataUrl(file)
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', () => reject(new Error('Nie udało się przygotować zdjęcia.')), { once: true })
      image.src = source
    })
    const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82)
  }

  function updateTrainerPhotoField() {
    const form = $('#authForm')
    const field = $('#trainerPhotoField')
    const input = form.elements.trainerPhoto
    const visible = state.authMode === 'register' && form.elements.role.value === 'trainer'
    field.hidden = !visible
    input.required = visible
  }

  function clearTrainerPhotoPreview() {
    state.trainerPhotoDataUrl = null
    const preview = $('#trainerPhotoPreview')
    preview.classList.remove('has-photo')
    preview.style.backgroundImage = ''
    preview.textContent = 'Dodaj'
  }

  function formatDate(value, options = {}) {
    if (!value) return '—'
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', ...options }).format(date)
  }

  function formatShortDate(value) {
    return formatDate(value, { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function showToast(message, tone = 'default') {
    const toast = $('#liveStatus')
    toast.textContent = message
    toast.dataset.tone = tone
    toast.classList.add('is-visible')
    clearTimeout(showToast.timer)
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 3200)
  }

  function setBusy(button, busy, busyText = 'Chwila…') {
    if (!button) return
    if (busy) {
      button.dataset.label = button.textContent
      button.textContent = busyText
      button.disabled = true
    } else {
      button.textContent = button.dataset.label || button.textContent
      button.disabled = false
    }
  }

  function emptyState(title, copy) {
    const box = element('div', 'empty-state')
    box.append(element('strong', '', title), element('p', '', copy))
    return box
  }

  function button(label, className = 'button button--secondary') {
    const node = element('button', className, label)
    node.type = 'button'
    return node
  }

  function openDialog(id) {
    const dialog = document.getElementById(id)
    if (dialog && !dialog.open) dialog.showModal()
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id)
    if (dialog?.open) dialog.close()
  }

  function requireSession(role) {
    if (!state.user) {
      setAuthMode('login')
      openDialog('authDialog')
      showToast('Zaloguj się, aby kontynuować.')
      return false
    }
    if (role && state.user.role !== role) {
      showToast('Ta sekcja nie jest dostępna dla tego konta.', 'error')
      return false
    }
    return true
  }

  function setAuthMode(mode) {
    state.authMode = mode === 'login' ? 'login' : 'register'
    const registering = state.authMode === 'register'
    $$('[data-auth]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.auth === state.authMode))
    $('#authTitle').textContent = registering ? 'Załóż konto' : 'Zaloguj się'
    $('#nameField').hidden = !registering
    $('#roleField').hidden = !registering
    $('#termsField').hidden = !registering
    $('#authForm').elements.fullName.required = registering
    $('#authSubmit').textContent = registering ? 'Załóż konto' : 'Zaloguj się'
    $('#authForm').elements.password.autocomplete = registering ? 'new-password' : 'current-password'
    updateTrainerPhotoField()
    $('#authError').textContent = ''
  }

  function renderAccount() {
    const loggedIn = Boolean(state.user)
    const name = state.user?.fullName || state.user?.name || ''
    $('#accountLabel').textContent = loggedIn ? name.split(' ')[0] : 'Zaloguj się'
    $('#accountRole').textContent = loggedIn ? (state.user.role === 'trainer' ? 'Konto trenera' : 'Konto klienta') : 'Twoje konto'
    applyAvatar($('#accountAvatar'), loggedIn ? state.user.avatarUrl : null, loggedIn ? name : 'RN')
    $('#authForm').hidden = loggedIn
    $('#authTabs').hidden = loggedIn
    $('#demoAccess').hidden = loggedIn || state.store?.mode !== 'demo'
    $('#accountPanel').hidden = !loggedIn
    if (loggedIn) {
      $('#authTitle').textContent = 'Twoje konto'
      applyAvatar($('#modalAvatar'), state.user.avatarUrl, name)
      $('#modalName').textContent = name
      $('#modalEmail').textContent = state.user.email || ''
    }
  }

  function renderNavigation() {
    const role = state.user?.role || 'client'
    const nav = $('#appNav')
    const moreNav = $('#moreNav')
    const primaryTrainerRoutes = ['overview', 'calendar', 'bookings', 'messages']
    nav.replaceChildren()
    moreNav.replaceChildren()
    const createNavigationButton = (item, className = '') => {
      const navButton = element('button', `${className}${state.route === item.route ? ' is-active' : ''}`.trim())
      navButton.type = 'button'
      navButton.dataset.route = item.route
      if (state.route === item.route) navButton.setAttribute('aria-current', 'page')
      navButton.append(icon(item.icon), element('span', '', item.label))
      navButton.addEventListener('click', () => navigate(item.route))
      return navButton
    }
    const items = helpers.navigationForRole(role)
    items.forEach(item => {
      const secondary = role === 'trainer' && !primaryTrainerRoutes.includes(item.route)
      nav.appendChild(createNavigationButton(item, secondary ? 'nav-secondary' : ''))
    })
    if (role === 'trainer') {
      const secondaryItems = items.filter(item => !primaryTrainerRoutes.includes(item.route))
      secondaryItems.forEach(item => {
        const moreAction = createNavigationButton(item)
        moreAction.addEventListener('click', () => closeDialog('moreDialog'), { once: true })
        moreNav.appendChild(moreAction)
      })
      const moreButton = element('button', `nav-more${secondaryItems.some(item => item.route === state.route) ? ' is-active' : ''}`)
      moreButton.type = 'button'
      moreButton.append(icon('plus'), element('span', '', 'Więcej'))
      moreButton.addEventListener('click', () => openDialog('moreDialog'))
      nav.appendChild(moreButton)
    }
    $('#sidebarTitle').textContent = role === 'trainer' ? 'Studio trenera' : 'Twoje treningi'
    document.body.dataset.role = role
  }

  function allowedRoutes() {
    const routes = helpers.navigationForRole(state.user?.role || 'client').map(item => item.route)
    if (state.user?.role === 'trainer' || (state.bookingFlowActive && state.selectedTrainer)) routes.push('calendar')
    return routes
  }

  async function navigate(route, options = {}) {
    const next = allowedRoutes().includes(route) ? route : (state.user?.role === 'trainer' ? 'overview' : 'discover')
    const protectedRoutes = ['overview', 'bookings', 'clients', 'messages', 'earnings', 'profile', 'settings']
    if (protectedRoutes.includes(next) && !state.user) {
      setAuthMode('login')
      openDialog('authDialog')
      return
    }
    if (next !== 'calendar') {
      state.bookingFlowActive = false
      state.selectedTrainer = null
    }
    state.route = next
    if (next !== 'messages' && state.messagePoll) {
      clearInterval(state.messagePoll)
      state.messagePoll = null
    }
    $$('.view').forEach(view => view.classList.toggle('is-active', view.dataset.route === next))
    const activeView = $(`.view[data-route="${next}"]`)
    activeView.querySelector('.view-error')?.remove()
    renderNavigation()
    if (!options.fromHash && !['register', 'login'].includes(next)) history.replaceState(null, '', `#${next}`)
    $('#content').focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    activeView.setAttribute('aria-busy', 'true')
    try {
      if (next === 'discover') await searchTrainers()
      if (next === 'overview') await renderOverview()
      if (next === 'calendar') await renderCalendar()
      if (next === 'bookings') await renderBookings()
      if (next === 'clients') await renderClients()
      if (next === 'messages') await renderConversations()
      if (next === 'earnings') await renderEarnings()
      if (next === 'profile') await loadTrainerProfile()
      if (next === 'settings') await loadPreferences()
    } catch (error) {
      showToast(error.message || 'Nie udało się wczytać widoku.', 'error')
      const errorState = emptyState('Nie udało się wczytać widoku.', 'Sprawdź połączenie i spróbuj ponownie.')
      errorState.classList.add('view-error')
      const retry = element('button', 'button button-secondary', 'Spróbuj ponownie')
      retry.type = 'button'
      retry.addEventListener('click', () => navigate(next))
      errorState.appendChild(retry)
      activeView.prepend(errorState)
    } finally {
      activeView.removeAttribute('aria-busy')
    }
  }

  function trainerAvatar(trainer) {
    const avatar = element('span', 'trainer-avatar')
    applyAvatar(avatar, trainer.avatarUrl, trainer.name)
    return avatar
  }

  function renderTrainerCard(trainer) {
    const card = element('article', 'trainer-card')
    const avatar = trainerAvatar(trainer)
    const info = element('div')
    const heading = element('h2', '', trainer.name)
    if (trainer.verified) {
      const verified = element('span', 'verified', 'Zweryfikowany')
      verified.prepend(icon('check'))
      heading.appendChild(verified)
    }
    const subtitle = element('p', '', `${trainer.disciplines.map(value => value[0].toUpperCase() + value.slice(1)).join(', ')} · ${trainer.district}`)
    const rating = element('p', '', `${trainer.rating ? `★ ${trainer.rating.toFixed(1)}` : 'Nowy profil'} · ${trainer.reviewCount} opinii · ${trainer.level || 'Każdy poziom'}`)
    info.append(heading, subtitle, rating)
    const tags = element('div', 'trainer-tags')
    trainer.disciplines.forEach(value => tags.appendChild(element('span', '', value)))
    info.appendChild(tags)
    const footer = element('div', 'trainer-card-footer')
    const price = element('div', 'trainer-price')
    price.append(element('strong', '', domain.formatMoney(trainer.hourlyRate)), element('small', '', ' / godz.'))
    const action = button('Zobacz terminy', 'button button--primary')
    action.appendChild(icon('arrow'))
    action.addEventListener('click', () => selectTrainer(trainer))
    footer.append(price, action)
    card.append(avatar, info, footer)
    return card
  }

  async function searchTrainers() {
    const results = $('#trainerResults')
    results.replaceChildren(emptyState('Szukamy trenerów…', 'Dopasowujemy profile do Twoich filtrów.'))
    const form = new FormData($('#searchForm'))
    const filters = helpers.normalizeFilters(Object.fromEntries(form))
    const trainers = await state.store.listTrainers(filters)
    const district = $('#district')
    if (district.options.length === 1) {
      const districts = [...new Set((await state.store.listTrainers()).map(item => item.district).filter(Boolean))].sort()
      districts.forEach(value => district.add(new Option(value, value)))
    }
    $('#trainerCount').textContent = trainers.length === 1 ? '1 dopasowany trener' : `${trainers.length} dopasowanych trenerów`
    results.replaceChildren()
    if (!trainers.length) {
      results.appendChild(emptyState('Brak dopasowań', 'Zmień dyscyplinę, dzielnicę albo limit ceny.'))
      return
    }
    trainers.forEach(trainer => results.appendChild(renderTrainerCard(trainer)))
  }

  async function selectTrainer(trainer) {
    state.selectedTrainer = trainer
    state.bookingFlowActive = true
    state.selectedDate = null
    state.weekAnchor = null
    await navigate('calendar')
  }

  function calendarAnchor() {
    if (state.weekAnchor) return state.weekAnchor
    const today = new Date()
    const slotDate = state.slots.find(slot => slot.status === 'available')?.startsAt
    return slotDate && new Date(slotDate).getFullYear() !== today.getFullYear() ? new Date(slotDate) : today
  }

  function renderWeek() {
    const week = domain.createWeek(calendarAnchor())
    if (!state.selectedDate) {
      const availableDay = week.find(day => state.slots.some(slot => slot.status === 'available' && helpers.localDateKey(slot.startsAt) === day.iso))
      state.selectedDate = availableDay?.iso || week.find(day => day.isToday)?.iso || week[0].iso
    }
    const strip = $('#calendarWeek')
    strip.replaceChildren()
    week.forEach(day => {
      const count = state.slots.filter(slot => helpers.localDateKey(slot.startsAt) === day.iso && slot.status === 'available').length
      const dayButton = element('button', `week-day${day.iso === state.selectedDate ? ' is-active' : ''}`)
      dayButton.type = 'button'
      dayButton.append(element('small', '', day.day), element('strong', '', String(day.date)), element('span', '', count ? `${count} ${count === 1 ? 'termin' : 'terminy'}` : 'brak'))
      dayButton.addEventListener('click', () => {
        state.selectedDate = day.iso
        renderWeek()
        renderAvailabilityPanel()
      })
      strip.appendChild(dayButton)
    })
  }

  function renderAvailabilityPanel() {
    const panel = $('#availabilityPanel')
    panel.replaceChildren()
    const daySlots = state.slots.filter(slot => helpers.localDateKey(slot.startsAt) === state.selectedDate)
    if (!daySlots.length) {
      panel.appendChild(emptyState(state.user?.role === 'trainer' ? 'Spokojny dzień' : 'Brak wolnych godzin', state.user?.role === 'trainer' ? 'Dodaj dostępność albo zostaw ten dzień bez treningów.' : 'Wybierz inny dzień lub wróć do listy trenerów.'))
      return
    }
    const group = element('div', 'slot-group')
    group.appendChild(element('h3', '', new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${state.selectedDate}T12:00:00`))))
    const list = element('div', 'slot-list')
    daySlots.forEach(slot => {
      const time = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date(slot.startsAt))
      const slotButton = button(state.user?.role === 'trainer' ? `${time} · ${labels[slot.status] || slot.status}` : time, 'slot-button')
      slotButton.disabled = state.user?.role !== 'trainer' && slot.status !== 'available'
      if (state.user?.role !== 'trainer') slotButton.addEventListener('click', () => chooseSlot(slot, slotButton))
      list.appendChild(slotButton)
    })
    group.appendChild(list)
    panel.appendChild(group)
  }

  function renderCalendarAside() {
    const aside = $('#calendarAside')
    aside.replaceChildren()
    if (state.user?.role === 'trainer') {
      aside.append(element('h3', '', 'Twój rytm tygodnia'), element('p', '', `${state.slots.filter(slot => slot.status === 'available').length} otwartych terminów. Blokady są widoczne tylko dla Ciebie.`))
      return
    }
    const discipline = state.selectedTrainer?.disciplines?.[0] || 'tenis'
    const asset = { tenis: 'Rino-tenis-3d-blue.png', padel: 'Rino-padel-3d-blue.png', boks: 'Rino-boks-3d-blue.png', golf: 'Rino-golf-3d-blue.png', squash: 'Rino-squash-3d-blue.png', 'pływanie': 'Rino-plywanie-3d-blue.png' }[discipline] || 'Rino-logo-v9.png'
    const image = document.createElement('img')
    image.src = `assets/${asset}`
    image.alt = ''
    aside.append(image, element('h3', '', 'Rezerwujesz bez stresu'), element('p', '', 'Wybierz godzinę. Po rezerwacji rozmowa z trenerem pojawi się automatycznie.'))
  }

  async function renderCalendar() {
    const trainerMode = state.user?.role === 'trainer'
    if (trainerMode) {
      $('#calendarTitle').textContent = 'Twój kalendarz'
      $('#calendarDescription').textContent = 'Publikuj wolne godziny i zaznaczaj własne blokady.'
      state.slots = await state.store.listAvailability(state.user.id)
      $('#calendarContext').replaceChildren()
    } else {
      if (!state.selectedTrainer) {
        const trainers = await state.store.listTrainers()
        state.selectedTrainer = trainers[0] || null
      }
      if (!state.selectedTrainer) {
        $('#availabilityPanel').replaceChildren(emptyState('Brak trenerów', 'Wróć tu później — profile są właśnie przygotowywane.'))
        return
      }
      $('#calendarTitle').textContent = `Terminy · ${state.selectedTrainer.name}`
      $('#calendarDescription').textContent = 'Wybierz dzień i godzinę, która pasuje do Twojego planu.'
      state.slots = await state.store.listAvailability(state.selectedTrainer.id)
      const context = $('#calendarContext')
      context.replaceChildren(trainerAvatar(state.selectedTrainer))
      const copy = element('div')
      copy.append(element('strong', '', state.selectedTrainer.name), element('p', '', `${state.selectedTrainer.disciplines.join(', ')} · ${state.selectedTrainer.district} · ${domain.formatMoney(state.selectedTrainer.hourlyRate)}/godz.`))
      context.appendChild(copy)
    }
    renderWeek()
    renderAvailabilityPanel()
    renderCalendarAside()
  }

  function chooseSlot(slot, slotButton) {
    state.selectedSlot = slot
    $$('.slot-button').forEach(item => item.classList.remove('is-selected'))
    slotButton.classList.add('is-selected')
    const summary = helpers.bookingSummary(state.selectedTrainer, slot)
    const box = $('#bookingSummary')
    box.replaceChildren()
    ;[
      ['Trener', summary.trainerName],
      ['Termin', formatDate(summary.startsAt)],
      ['Cena', domain.formatMoney(summary.price)],
    ].forEach(([label, value]) => {
      const row = element('div', 'booking-summary-row')
      row.append(element('span', '', label), element('strong', '', value))
      box.appendChild(row)
    })
    $('#bookingError').textContent = ''
    openDialog('bookingDialog')
  }

  async function confirmBooking() {
    if (!state.selectedSlot || !state.selectedTrainer) return
    if (!state.user) {
      state.resumeBooking = true
      closeDialog('bookingDialog')
      setAuthMode('login')
      openDialog('authDialog')
      showToast('Zaloguj się, aby dokończyć rezerwację.')
      return
    }
    if (!requireSession('client')) return
    const action = $('#confirmBooking')
    setBusy(action, true, 'Rezerwujemy…')
    $('#bookingError').textContent = ''
    try {
      await state.store.createBooking({ trainerId: state.selectedTrainer.id, slotId: state.selectedSlot.id })
      closeDialog('bookingDialog')
      state.selectedSlot = null
      showToast('Trening został zarezerwowany.')
      await navigate('bookings')
    } catch (error) {
      $('#bookingError').textContent = error.message
    } finally {
      setBusy(action, false)
    }
  }

  function statusClass(status) {
    if (['confirmed', 'completed', 'available'].includes(status)) return 'status-chip status-chip--success'
    if (status === 'pending') return 'status-chip status-chip--warning'
    return 'status-chip status-chip--muted'
  }

  function bookingMatchesFilter(booking) {
    if (state.bookingFilter === 'completed') return booking.status === 'completed'
    if (state.bookingFilter === 'upcoming') return ['pending', 'confirmed'].includes(booking.status)
    return true
  }

  function renderBookingCard(booking) {
    const card = element('article', 'booking-card')
    const date = new Date(booking.startsAt)
    const dateBox = element('div', 'date-tile')
    dateBox.append(element('strong', '', String(date.getDate()).padStart(2, '0')), element('small', '', date.toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '')))
    const info = element('div')
    const otherName = state.user.role === 'trainer' ? booking.clientName : booking.trainerName
    info.append(element('h2', '', otherName || 'Trening RinoMove'), element('p', '', `${formatDate(booking.startsAt)} · ${booking.location || 'Miejsce do ustalenia'}`), element('span', statusClass(booking.status), labels[booking.status] || booking.status))
    const actions = element('div', 'booking-card-actions')
    helpers.bookingActions(booking, state.user.role).forEach(nextStatus => {
      const action = button(nextStatus === 'cancelled' ? 'Anuluj' : nextStatus === 'completed' ? 'Zakończ trening' : 'Potwierdź', 'booking-action')
      action.addEventListener('click', async () => {
        setBusy(action, true)
        try {
          await state.store.updateBookingStatus(booking.id, nextStatus)
          showToast('Status rezerwacji został zmieniony.')
          await renderBookings()
        } catch (error) {
          showToast(error.message, 'error')
        } finally {
          setBusy(action, false)
        }
      })
      actions.appendChild(action)
    })
    if (state.user.role === 'client' && booking.status === 'completed' && booking.paymentStatus === 'paid' && !booking.reviewed) {
      const review = button('Dodaj opinię', 'booking-action')
      review.addEventListener('click', () => {
        $('#reviewForm').elements.bookingId.value = booking.id
        $('#reviewError').textContent = ''
        openDialog('reviewDialog')
      })
      actions.appendChild(review)
    }
    card.append(dateBox, info, actions)
    return card
  }

  async function renderBookings() {
    if (!requireSession()) return
    const bookings = (await state.store.listBookings()).filter(bookingMatchesFilter)
    const list = $('#bookingList')
    list.replaceChildren()
    $('#bookingsTitle').textContent = state.user.role === 'trainer' ? 'Rezerwacje klientów' : 'Twoje rezerwacje'
    if (!bookings.length) {
      list.appendChild(emptyState('Tutaj jest spokojnie', state.bookingFilter === 'all' ? 'Pierwsza rezerwacja pojawi się w tym miejscu.' : 'Brak rezerwacji w wybranym widoku.'))
      return
    }
    bookings.forEach(booking => list.appendChild(renderBookingCard(booking)))
  }

  function metricCard(label, value, copy, tone = '') {
    const card = element('article', `metric-card${tone ? ` metric-card--${tone}` : ''}`)
    card.append(element('small', '', label), element('strong', '', value), element('span', '', copy))
    return card
  }

  async function renderOverview() {
    if (!requireSession('trainer')) return
    const dashboard = await state.store.getDashboard()
    const name = state.user.fullName || state.user.name || 'Trenerze'
    $('#overviewTitle').textContent = `${name.split(' ')[0]}, oto Twój plan`
    const metrics = $('#overviewMetrics')
    metrics.replaceChildren(
      metricCard('Do potwierdzenia', String(dashboard.pendingCount || 0), 'rezerwacji czeka na decyzję', 'pink'),
      metricCard('Aktywni klienci', String(dashboard.clientCount || 0), 'osób trenowało z Tobą', 'blue'),
      metricCard('Do wypłaty', domain.formatMoney(dashboard.earnings?.payout || 0), 'po opłacie platformowej', 'lime'),
      metricCard('Treningi', String(dashboard.earnings?.count || 0), 'rozliczonych spotkań'),
    )
    const next = $('#nextBookingCard')
    next.replaceChildren()
    if (dashboard.nextBooking) next.append(element('h2', '', dashboard.nextBooking.clientName || 'Klient RinoMove'), element('p', '', formatDate(dashboard.nextBooking.startsAt)), element('p', '', dashboard.nextBooking.location || 'Miejsce do ustalenia'))
    else next.append(element('h2', '', 'Brak nadchodzących treningów'), element('p', '', 'Dodaj dostępność, aby klienci mogli zarezerwować termin.'))
    const actions = $('#trainerActions')
    actions.replaceChildren()
    ;[
      ['Uzupełnij wolne godziny', 'Klienci zobaczą je od razu w kalendarzu.', 'calendar'],
      ['Sprawdź rezerwacje', `${dashboard.pendingCount || 0} oczekujących decyzji.`, 'bookings'],
      ['Zobacz rozliczenia', `${domain.formatMoney(dashboard.earnings?.payout || 0)} gotowe do wypłaty.`, 'earnings'],
    ].forEach(([title, copy, route]) => {
      const row = element('div', 'action-item')
      const text = element('div')
      text.append(element('p', '', title), element('small', '', copy))
      const action = button('Otwórz', 'button button--text')
      action.addEventListener('click', () => navigate(route))
      row.append(text, action)
      actions.appendChild(row)
    })
  }

  async function renderClients() {
    if (!requireSession('trainer')) return
    const clients = await state.store.listClients()
    const list = $('#clientList')
    list.replaceChildren()
    if (!clients.length) {
      list.appendChild(emptyState('Jeszcze bez klientów', 'Gdy ktoś zarezerwuje trening, jego karta pojawi się tutaj.'))
      return
    }
    clients.forEach(client => {
      const card = element('article', 'client-card')
      card.append(element('span', 'avatar', initials(client.fullName || client.name)), element('h2', '', client.fullName || client.name), element('p', '', client.email || 'Kontakt w RinoMove'), element('p', '', `${client.completedCount} zakończonych · ${client.bookingCount} wszystkich treningów`), element('small', '', client.lastTrainingAt ? `Ostatni: ${formatShortDate(client.lastTrainingAt)}` : 'Pierwszy trening przed Wami'))
      list.appendChild(card)
    })
  }

  async function renderEarnings() {
    if (!requireSession('trainer')) return
    const earnings = await state.store.getEarnings()
    $('#earningMetrics').replaceChildren(
      metricCard('Przychód brutto', domain.formatMoney(earnings.gross), 'wartość zakończonych treningów', 'blue'),
      metricCard('Opłata platformowa', domain.formatMoney(earnings.fee), '10% obsługi RinoMove'),
      metricCard('Do wypłaty', domain.formatMoney(earnings.payout), 'Twoje środki', 'lime'),
      metricCard('Rozliczone', String(earnings.count), 'treningów'),
    )
    const table = $('#earningsTable')
    table.replaceChildren()
    if (!earnings.transactions.length) {
      const row = document.createElement('tr')
      const cell = element('td', '', 'Brak rozliczonych treningów.')
      cell.colSpan = 6
      row.appendChild(cell)
      table.appendChild(row)
      return
    }
    earnings.transactions.forEach(transaction => {
      const row = document.createElement('tr')
      const values = [formatShortDate(transaction.startsAt), transaction.clientName || 'Klient', domain.formatMoney(transaction.price), domain.formatMoney(transaction.platformFee), domain.formatMoney(transaction.price - transaction.platformFee), 'Rozliczona']
      values.forEach(value => row.appendChild(element('td', '', value)))
      table.appendChild(row)
    })
  }

  async function renderConversations() {
    if (!requireSession()) return
    state.conversations = await state.store.listConversations()
    const list = $('#conversationList')
    list.replaceChildren()
    if (!state.conversations.length) {
      list.appendChild(emptyState('Brak rozmów', 'Czat powstanie automatycznie po pierwszej rezerwacji.'))
      $('#messages').replaceChildren(emptyState('Wszystko w jednym miejscu', 'Ustalenia z trenerem lub klientem pojawią się tutaj.'))
      return
    }
    state.conversations.forEach(conversation => {
      const otherName = conversation.other?.fullName || conversation.other?.name || 'RinoMove'
      const item = element('button', `conversation-button${state.selectedConversation?.id === conversation.id ? ' is-active' : ''}${conversation.unread ? ' has-unread' : ''}`)
      item.type = 'button'
      item.append(element('span', 'avatar', initials(otherName)))
      const copy = element('span')
      copy.append(element('strong', '', otherName), element('small', '', conversation.lastMessage?.body || 'Rozpocznij rozmowę'))
      item.appendChild(copy)
      item.addEventListener('click', () => selectConversation(conversation))
      list.appendChild(item)
    })
    const selected = state.selectedConversation && state.conversations.find(item => item.id === state.selectedConversation.id)
    await selectConversation(selected || state.conversations[0], false)
  }

  async function selectConversation(conversation, rerenderList = true) {
    state.selectedConversation = conversation
    if (state.unsubscribeMessages) state.unsubscribeMessages()
    state.unsubscribeMessages = null
    await state.store.markConversationRead(conversation.id)
    conversation.unread = false
    if (rerenderList) {
      $$('.conversation-button').forEach((item, index) => {
        item.classList.toggle('is-active', state.conversations[index]?.id === conversation.id)
        if (state.conversations[index]?.id === conversation.id) item.classList.remove('has-unread')
      })
    }
    const otherName = conversation.other?.fullName || conversation.other?.name || 'RinoMove'
    const header = $('#threadHeader')
    header.replaceChildren(element('span', 'avatar', initials(otherName)), element('strong', '', otherName))
    await renderMessages()
    if (state.store.subscribeToMessages) {
      state.unsubscribeMessages = state.store.subscribeToMessages(conversation.id, () => renderMessages())
    } else {
      if (state.messagePoll) clearInterval(state.messagePoll)
      state.messagePoll = setInterval(() => {
        if (state.route === 'messages') renderMessages().catch(() => {})
      }, 5000)
    }
  }

  async function renderMessages() {
    if (!state.selectedConversation) return
    const messages = await state.store.listMessages(state.selectedConversation.id)
    const list = $('#messages')
    list.replaceChildren()
    if (!messages.length) list.appendChild(emptyState('Napisz pierwszą wiadomość', 'Krótko ustalcie miejsce i szczegóły treningu.'))
    messages.forEach(message => {
      const bubble = element('article', `message${message.senderId === state.user.id ? ' is-mine' : ''}`)
      const messageBody = document.createElement('p')
      messageBody.textContent = message.body
      bubble.append(messageBody, element('time', '', formatDate(message.createdAt, { day: undefined, month: undefined })))
      list.appendChild(bubble)
    })
    list.scrollTop = list.scrollHeight
  }

  async function loadTrainerProfile() {
    if (!requireSession('trainer')) return
    const profile = await state.store.getTrainerProfile()
    const form = $('#trainerProfileForm')
    form.elements.bio.value = profile.bio || ''
    form.elements.discipline.value = profile.disciplines?.[0] || 'tenis'
    form.elements.district.value = profile.district || ''
    form.elements.hourlyRate.value = Math.round((profile.hourlyRate || 0) / 100)
    form.elements.published.checked = Boolean(profile.published)
    renderProfilePreview(profile)
  }

  function renderProfilePreview(profile) {
    const preview = $('#profilePreview')
    preview.replaceChildren(element('span', 'eyebrow', 'Podgląd'))
    const name = state.user?.fullName || state.user?.name || 'Twój profil'
    const avatar = element('span', 'trainer-avatar')
    applyAvatar(avatar, profile.avatarUrl || state.user?.avatarUrl, name)
    preview.append(avatar, element('h2', '', name), element('p', '', profile.bio || 'Dodaj opis sposobu współpracy.'), element('p', '', `${profile.disciplines?.join(', ') || 'Dyscyplina'} · ${profile.district || 'Lokalizacja'}`), element('strong', '', `${domain.formatMoney(profile.hourlyRate || 0)} / godz.`), element('span', statusClass(profile.published ? 'confirmed' : 'cancelled'), profile.published ? 'Profil widoczny' : 'Profil ukryty'))
  }

  async function loadPreferences() {
    if (!requireSession()) return
    const preferences = await state.store.getPreferences()
    const form = $('#preferencesForm')
    Object.keys(helpers.preferencePayload(preferences)).forEach(key => {
      if (form.elements[key]) form.elements[key].checked = Boolean(preferences[key])
    })
  }

  async function savePreferences(form) {
    await state.store.savePreferences(helpers.preferencePayload({
      email: form.elements.email.checked,
      sms: form.elements.sms.checked,
      push: form.elements.push.checked,
      before24h: form.elements.before24h.checked,
      before2h: form.elements.before2h.checked,
      afterTraining: form.elements.afterTraining.checked,
    }))
    showToast('Ustawienia powiadomień zapisane.')
  }

  async function updateSession(user) {
    state.user = user || null
    state.selectedConversation = null
    state.selectedDate = null
    state.weekAnchor = null
    if (state.unsubscribeMessages) state.unsubscribeMessages()
    state.unsubscribeMessages = null
    if (state.messagePoll) clearInterval(state.messagePoll)
    state.messagePoll = null
    renderAccount()
    renderNavigation()
  }

  function setupEvents() {
    $('#accountButton').addEventListener('click', () => {
      renderAccount()
      if (!state.user) setAuthMode('login')
      openDialog('authDialog')
    })
    $$('[data-close-dialog]').forEach(action => action.addEventListener('click', () => closeDialog(action.dataset.closeDialog)))
    $$('[data-auth]').forEach(action => action.addEventListener('click', () => setAuthMode(action.dataset.auth)))
    $('#authForm').elements.role.addEventListener('change', updateTrainerPhotoField)
    $('#authForm').elements.trainerPhoto.addEventListener('change', async event => {
      const preview = $('#trainerPhotoPreview')
      try {
        const file = helpers.validateTrainerPhoto(event.currentTarget.files?.[0])
        state.trainerPhotoDataUrl = await prepareTrainerPhoto(file)
        preview.style.backgroundImage = `url("${state.trainerPhotoDataUrl}")`
        preview.classList.add('has-photo')
        preview.textContent = ''
        $('#authError').textContent = ''
      } catch (error) {
        event.currentTarget.value = ''
        clearTrainerPhotoPreview()
        $('#authError').textContent = error.message
      }
    })
    $$('[data-route-to]').forEach(action => action.addEventListener('click', () => navigate(action.dataset.routeTo)))
    $('#searchForm').addEventListener('submit', event => {
      event.preventDefault()
      searchTrainers().catch(error => showToast(error.message, 'error'))
    })
    $('#confirmBooking').addEventListener('click', confirmBooking)
    ;[['#prevWeek', -1], ['#nextWeek', 1]].forEach(([selector, direction]) => {
      $(selector).addEventListener('click', () => {
        state.weekAnchor = helpers.shiftWeek(calendarAnchor(), direction)
        state.selectedDate = null
        renderWeek()
        renderAvailabilityPanel()
      })
    })
    $('#openAvailability').addEventListener('click', () => {
      if (!requireSession('trainer')) return
      const form = $('#availabilityForm')
      const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
      start.setMinutes(0, 0, 0)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const localValue = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      form.elements.startsAt.value = localValue(start)
      form.elements.endsAt.value = localValue(end)
      $('#availabilityError').textContent = ''
      openDialog('availabilityDialog')
    })
    $('#availabilityForm').addEventListener('submit', async event => {
      event.preventDefault()
      const form = event.currentTarget
      const submit = form.querySelector('[type="submit"]')
      setBusy(submit, true, 'Dodajemy…')
      $('#availabilityError').textContent = ''
      try {
        const input = helpers.validateAvailabilityInput(form.elements.startsAt.value, form.elements.endsAt.value, form.elements.status.value)
        await state.store.setAvailability(input)
        closeDialog('availabilityDialog')
        showToast('Termin został dodany do kalendarza.')
        await renderCalendar()
      } catch (error) {
        $('#availabilityError').textContent = error.message
      } finally {
        setBusy(submit, false)
      }
    })
    $('#bookingFilters').addEventListener('click', event => {
      const action = event.target.closest('[data-booking-filter]')
      if (!action) return
      state.bookingFilter = action.dataset.bookingFilter
      $$('[data-booking-filter]').forEach(item => item.classList.toggle('is-active', item === action))
      renderBookings().catch(error => showToast(error.message, 'error'))
    })
    $('#chatForm').addEventListener('submit', async event => {
      event.preventDefault()
      if (!state.selectedConversation) return
      const input = $('#chatInput')
      const submit = event.currentTarget.querySelector('button')
      try {
        const body = helpers.cleanMessage(input.value)
        setBusy(submit, true, 'Wysyłamy…')
        await state.store.sendMessage(state.selectedConversation.id, body)
        input.value = ''
        await renderMessages()
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        setBusy(submit, false)
      }
    })
    $('#preferencesForm').addEventListener('change', async event => {
      const form = event.currentTarget
      try {
        await savePreferences(form)
      } catch (error) {
        showToast(error.message, 'error')
      }
    })
    $('#preferencesForm').addEventListener('submit', async event => {
      event.preventDefault()
      try {
        await savePreferences(event.currentTarget)
      } catch (error) {
        showToast(error.message, 'error')
      }
    })
    $('#trainerProfileForm').addEventListener('input', event => {
      const form = event.currentTarget
      renderProfilePreview({ bio: form.elements.bio.value, disciplines: [form.elements.discipline.value], district: form.elements.district.value, hourlyRate: Number(form.elements.hourlyRate.value || 0) * 100, published: form.elements.published.checked })
    })
    $('#trainerProfileForm').addEventListener('submit', async event => {
      event.preventDefault()
      const form = event.currentTarget
      const submit = form.querySelector('[type="submit"]')
      setBusy(submit, true, 'Zapisujemy…')
      try {
        const profile = await state.store.saveTrainerProfile({ bio: form.elements.bio.value.trim(), disciplines: [form.elements.discipline.value], district: form.elements.district.value.trim(), hourlyRate: Number(form.elements.hourlyRate.value || 0) * 100, published: form.elements.published.checked })
        renderProfilePreview(profile)
        showToast('Profil trenera został zapisany.')
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        setBusy(submit, false)
      }
    })
    $('#reviewForm').addEventListener('submit', async event => {
      event.preventDefault()
      const form = event.currentTarget
      const submit = form.querySelector('[type="submit"]')
      setBusy(submit, true, 'Publikujemy…')
      $('#reviewError').textContent = ''
      try {
        await state.store.createReview({ bookingId: form.elements.bookingId.value, rating: Number(form.elements.rating.value), body: form.elements.body.value.trim() })
        closeDialog('reviewDialog')
        form.reset()
        showToast('Dziękujemy — opinia została opublikowana.')
        await renderBookings()
      } catch (error) {
        $('#reviewError').textContent = error.message
      } finally {
        setBusy(submit, false)
      }
    })
    $('#logoutButton').addEventListener('click', async () => {
      await state.store.signOut()
      state.resumeBooking = false
      setAuthMode('login')
      closeDialog('authDialog')
      await updateSession(null)
      showToast('Wylogowano.')
      await navigate('discover')
    })
    $('#authForm').addEventListener('submit', async event => {
      event.preventDefault()
      const form = event.currentTarget
      const submit = $('#authSubmit')
      setBusy(submit, true, state.authMode === 'register' ? 'Tworzymy konto…' : 'Logujemy…')
      $('#authError').textContent = ''
      try {
        const values = new FormData(form)
        const input = { email: values.get('email'), password: values.get('password') }
        if (state.authMode === 'register') {
          Object.assign(input, { fullName: values.get('fullName'), role: values.get('role'), acceptTerms: values.get('acceptTerms') === 'on' })
          if (input.role === 'trainer') input.avatarDataUrl = state.trainerPhotoDataUrl || await prepareTrainerPhoto(helpers.validateTrainerPhoto(form.elements.trainerPhoto.files?.[0]))
        }
        const result = state.authMode === 'register' ? await state.store.signUp(input) : await state.store.signIn(input)
        if (result.needsConfirmation) {
          setAuthMode('login')
          $('#authError').textContent = 'Sprawdź skrzynkę e-mail i potwierdź konto, a potem się zaloguj.'
          return
        }
        const shouldResumeBooking = state.resumeBooking && result.user.role === 'client'
        state.resumeBooking = false
        await updateSession(result.user)
        closeDialog('authDialog')
        form.reset()
        clearTrainerPhotoPreview()
        updateTrainerPhotoField()
        showToast(state.authMode === 'register' ? 'Konto jest gotowe.' : 'Zalogowano.')
        await navigate(shouldResumeBooking ? 'calendar' : (result.user.role === 'trainer' ? 'overview' : 'discover'))
        if (shouldResumeBooking) openDialog('bookingDialog')
      } catch (error) {
        $('#authError').textContent = error.message
      } finally {
        setBusy(submit, false)
      }
    })
    $$('[data-demo-login]').forEach(action => action.addEventListener('click', async () => {
      const role = action.dataset.demoLogin
      const account = state.store.demoAccounts?.find(item => item.role === role)
      if (!account) return
      setBusy(action, true, 'Wchodzimy…')
      try {
        const result = await state.store.signIn(account)
        const shouldResumeBooking = state.resumeBooking && result.user.role === 'client'
        state.resumeBooking = false
        await updateSession(result.user)
        closeDialog('authDialog')
        showToast(`Witaj w wersji demo ${role === 'trainer' ? 'trenera' : 'klienta'}.`)
        await navigate(shouldResumeBooking ? 'calendar' : (role === 'trainer' ? 'overview' : 'discover'))
        if (shouldResumeBooking) openDialog('bookingDialog')
      } catch (error) {
        $('#authError').textContent = error.message
      } finally {
        setBusy(action, false)
      }
    }))
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1)
      if (allowedRoutes().includes(hash)) navigate(hash, { fromHash: true })
    })
  }

  async function init() {
    try {
      state.store = await window.RinoAppStore.createAppStore()
      $('#modeBadge').textContent = state.store.mode === 'supabase' ? 'Supabase online' : 'Tryb demo'
      $('#modeBadge').classList.toggle('is-live', state.store.mode === 'supabase')
      $('#modeBadge').classList.toggle('is-demo', state.store.mode === 'demo')
      setupEvents()
      const requestedRole = new URLSearchParams(window.location.search).get('role'); if (requestedRole==='trainer') $('#authForm').elements.role.value='trainer'
      const requestedAuthMode = window.RinoAuthRoute.modeFromHash(window.location.hash)
      if (requestedAuthMode) {
        setAuthMode(requestedAuthMode)
        openDialog('authDialog')
      } else setAuthMode('login')
      const session = await state.store.getSession()
      await updateSession(session?.user || null)
      const routeFromHash = window.location.hash.slice(1)
      const initialRoute = requestedAuthMode ? (state.user?.role === 'trainer' ? 'overview' : 'discover') : routeFromHash
      await navigate(allowedRoutes().includes(initialRoute) ? initialRoute : (state.user?.role === 'trainer' ? 'overview' : 'discover'), { fromHash: true })
    } catch (error) {
      $('#modeBadge').textContent = 'Błąd połączenia'
      showToast(error.message || 'Nie udało się uruchomić panelu.', 'error')
      console.error(error)
    }
  }

  init()
})()
