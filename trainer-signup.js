(() => {
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-trainer-signup]')
    if (!form) return

    event.preventDefault()
    if (form.dataset.submitting === 'true') return

    const button = form.querySelector('[type="submit"]')
    const status = form.querySelector('[data-signup-status]')
    const data = new FormData(form)
    const originalLabel = button.textContent

    form.dataset.submitting = 'true'
    button.disabled = true
    button.textContent = 'Wysyłanie…'
    status.textContent = ''
    status.classList.remove('is-success', 'is-error')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          discipline: data.get('discipline'),
          consent: data.get('consent') === 'on',
          website: data.get('website'),
          source: form.dataset.source
        })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Nie udało się wysłać zgłoszenia.')

      form.reset()
      status.textContent = 'Dziękujemy! Odezwiemy się przed startem.'
      status.classList.add('is-success')
    } catch (error) {
      status.textContent = error.message || 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'
      status.classList.add('is-error')
    } finally {
      delete form.dataset.submitting
      button.disabled = false
      button.textContent = originalLabel
    }
  })
})()
