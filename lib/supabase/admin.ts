import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client: bypasses row-level security. Server-only — never import
// this from a client component, and only use it after the route has done its
// own validation.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
