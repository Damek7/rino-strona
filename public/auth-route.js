(function (root, factory) {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root) root.RinoAuthRoute = api
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function modeFromHash(hash) {
    return hash === '#login' || hash === '#register' ? hash.slice(1) : null
  }

  return { modeFromHash }
})
