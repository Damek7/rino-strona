(() => {
  const states = new WeakMap()

  function getState(form) {
    if (states.has(form)) return states.get(form)
    const state = {
      form,
      steps: [...form.querySelectorAll('[data-signup-step]')],
      contact: form.querySelector('[data-signup-contact]'),
      back: form.querySelector('[data-signup-back]'),
      next: form.querySelector('[data-signup-next]'),
      currentLabel: form.querySelector('[data-signup-current]'),
      progress: form.querySelector('progress'),
      status: form.querySelector('[data-signup-status]'),
      other: form.querySelector('[data-other-result]'),
      otherInput: form.querySelector('[name="desiredResultOther"]'),
      current: 0
    }
    states.set(form, state)
    return state
  }

  function activePanel(state) {
    return state.current < state.steps.length ? state.steps[state.current] : state.contact
  }

  function render(state) {
    state.steps.forEach((step, index) => { step.hidden = index !== state.current })
    state.contact.hidden = state.current !== state.steps.length
    state.currentLabel.textContent = String(Math.min(state.current + 1, 7))
    state.progress.value = Math.min(state.current + 1, 7)
    state.back.hidden = state.current === 0
    state.next.hidden = state.current === state.steps.length
    activePanel(state).querySelector('input, textarea')?.focus()
  }

  function panelValid(panel) {
    const readiness = panel.querySelectorAll('[name="readiness"]')
    if (readiness.length && ![...readiness].some(input => input.checked)) {
      readiness[0].setCustomValidity('Wybierz przynajmniej jedną odpowiedź.')
      readiness[0].reportValidity()
      return false
    }
    readiness.forEach(input => input.setCustomValidity(''))
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
      state.current += 1
    } else {
      state.current = Math.max(0, state.current - 1)
    }
    render(state)
  })

  document.addEventListener('change', event => {
    if (event.target.name !== 'desiredResult') return
    const form = event.target.closest('[data-trainer-signup]')
    if (!form) return
    const state = getState(form)
    const show = event.target.value === 'other'
    state.other.hidden = !show
    state.otherInput.required = show
    if (!show) state.otherInput.value = ''
  })

  document.addEventListener('submit', async event => {
    const form = event.target.closest('[data-trainer-signup]')
    if (!form) return
    event.preventDefault()
    const state = getState(form)
    if (form.dataset.submitting === 'true' || !panelValid(state.contact)) return
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
          venue: data.get('venue'),
          workModel: data.get('workModel'),
          capacity: data.get('capacity'),
          blocker: data.get('blocker'),
          whyNow: data.get('whyNow'),
          readiness: data.getAll('readiness'),
          desiredResult: data.get('desiredResult'),
          desiredResultOther: data.get('desiredResultOther'),
          consent: data.get('consent') === 'on',
          website: data.get('website'),
          source: form.dataset.source
        })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Nie udało się wysłać zgłoszenia.')
      form.reset()
      state.current = 0
      state.other.hidden = true
      state.otherInput.required = false
      render(state)
      state.status.textContent = 'Dziękujemy! Sprawdzimy zgłoszenie i skontaktujemy się z wybranymi trenerami.'
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
})()
