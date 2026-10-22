// Server-only. Shared request counters backed by hit_rate_limit()
// (supabase/migrations/0018_rate_limits.sql).

import { createAdminClient } from '@/lib/supabase/admin'

let warnedUnavailable = false

/**
 * The caller's IP. Vercel sets both headers itself and discards any value the
 * client sent; behind another host they could be forged, which would only
 * let one visitor spread their requests over several counters.
 */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/**
 * Counts one hit against `key` and returns whether it is still within `limit`
 * hits per `windowSeconds`.
 *
 * Fails open: without the service-role key, or if the database call fails,
 * the request is allowed — a broken counter must not take checkout down.
 */
export async function underRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc('hit_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) throw error
    return data !== false
  } catch (error) {
    if (!warnedUnavailable) {
      warnedUnavailable = true
      console.warn(
        '[rate-limit] not enforced:',
        error instanceof Error ? error.message : error
      )
    }
    return true
  }
}
