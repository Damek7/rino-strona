(function (root, factory) {
  const api = factory(root)
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root) root.RinoPublicNavigation = api
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  function setMenuOpen(toggle, menu, isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen))
    menu.classList.toggle('menu-open', isOpen)
  }

  function initNavigation(documentRoot) {
    const navigation = documentRoot.querySelector('.public-navigation')
    if (!navigation) return

    const toggle = navigation.querySelector('.mobile-menu-button')
    const menu = navigation.querySelector('#main-menu')
    if (!toggle || !menu) return

    toggle.addEventListener('click', () => {
      setMenuOpen(toggle, menu, toggle.getAttribute('aria-expanded') !== 'true')
    })
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) setMenuOpen(toggle, menu, false)
    })
  }

  if (root && root.document) {
    root.addEventListener('DOMContentLoaded', () => initNavigation(root.document))
  }

  return { setMenuOpen, initNavigation }
})
