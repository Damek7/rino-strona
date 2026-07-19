(() => {
  const states = new WeakMap()

  function getState(form) {
    if (states.has(form)) return states.get(form)
    const state = {
      form,
      steps: [...form.querySelectorAll('[data-signup-step]')],
      back: form.querySelector('[data-signup-back]'),
      next: form.querySelector('[data-signup-next]'),
      currentLabel: form.querySelector('[data-signup-current]'),
      progress: form.querySelector('progress'),
      status: form.querySelector('[data-signup-status]'),
      current: 0
    }
    states.set(form, state)
    return state
  }

  function activePanel(state) {
    return state.steps[state.current]
  }

  function render(state, focus = true) {
    state.steps.forEach((step, index) => { step.hidden = index !== state.current })
    state.currentLabel.textContent = String(state.current + 1)
    state.progress.max = state.steps.length
    state.progress.value = state.current + 1
    state.back.hidden = state.current === 0
    state.next.hidden = state.current === state.steps.length - 1
    if (focus) activePanel(state).querySelector('input, textarea')?.focus()
  }

  function panelValid(panel) {
    const controls = [...panel.querySelectorAll('input, textarea')].filter(input => !input.disabled)
    const invalid = controls.find(input => !input.checkValidity())
    if (invalid) {
      invalid.reportValidity()
      return false
    }
    return true
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-signup-next], [data-signup-back]')
    const form = button?.closest('[data-trainer-signup]')
    if (!form) return
    const state = getState(form)

    if (button.matches('[data-signup-next]')) {
      if (!panelValid(activePanel(state))) return
      state.current = Math.min(state.steps.length - 1, state.current + 1)
    } else {
      state.current = Math.max(0, state.current - 1)
    }
    render(state)
  })

  document.addEventListener('submit', async event => {
    const form = event.target.closest('[data-trainer-signup]')
    if (!form) return
    event.preventDefault()
    const state = getState(form)
    if (form.dataset.submitting === 'true' || !panelValid(activePanel(state))) return
    const button = form.querySelector('[type="submit"]')
    const data = new FormData(form)
    const originalLabel = button.textContent
    form.dataset.submitting = 'true'
    button.disabled = true
    button.textContent = 'Wysyłanie…'
    state.status.textContent = ''
    state.status.classList.remove('is-success', 'is-error')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          profileUrl: data.get('profileUrl'),
          discipline: data.get('discipline'),
          city: data.get('city'),
          district: data.get('district'),
          workModel: data.get('workModel'),
          acceptingClients: data.get('acceptingClients'),
          primaryNeed: data.get('primaryNeed'),
          blocker: data.get('blocker'),
          consent: data.get('consent') === 'on',
          website: data.get('website'),
          source: form.dataset.source
        })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Nie udało się wysłać zgłoszenia.')
      form.reset()
      state.current = 0
      render(state, false)
      state.status.textContent = 'Dziękujemy. Przejrzymy zgłoszenie i wrócimy z informacją o kolejnym kroku.'
      state.status.classList.add('is-success')
    } catch (error) {
      state.status.textContent = error.message || 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'
      state.status.classList.add('is-error')
    } finally {
      delete form.dataset.submitting
      button.disabled = false
      button.textContent = originalLabel
    }
  })

  document.querySelectorAll('[data-trainer-signup]').forEach(form => render(getState(form), false))
})()
