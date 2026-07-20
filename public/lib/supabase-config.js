'use strict'

function publicConfig(env = process.env) {
  const supabaseUrl = String(env.SUPABASE_URL || '').trim()
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  try {
    const parsed = new URL(supabaseUrl)
    if (parsed.protocol !== 'https:' || !publishableKey) return { mode: 'demo' }
  } catch {
    return { mode: 'demo' }
  }
  return { mode: 'supabase', supabaseUrl, publishableKey }
}

module.exports = { publicConfig }
