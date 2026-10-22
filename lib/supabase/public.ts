import { createClient } from '@supabase/supabase-js'

// Server-side reads of public data (the catalog) without the visitor's
// cookies, so a page using it can be cached and shared between visitors.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
