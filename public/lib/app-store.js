(function (root, factory) {
  const api = factory(root)
  if (typeof module === 'object' && module.exports) module.exports = api
  root.RinoAppStore = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict'

  async function createAppStore(options = {}) {
    const fetcher = options.fetcher || root.fetch?.bind(root)
    let config = { mode: 'demo' }
    try {
      const response = await fetcher('/api/config', { headers: { Accept: 'application/json' } })
      if (response.ok) config = await response.json()
    } catch {}

    if (config.mode === 'supabase' && root.supabase?.createClient && root.RinoSupabaseStore?.createSupabaseStore) {
      const client = root.supabase.createClient(config.supabaseUrl, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
      return root.RinoSupabaseStore.createSupabaseStore(client)
    }
    return root.RinoDemoStore.createDemoStore(options.storage || root.localStorage)
  }

  return { createAppStore }
})
