import 'server-only'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client. Bypasses RLS: use ONLY in Server Actions / route handlers,
 * after the caller has been authenticated and the write has been authorized in code
 * (e.g. wallet linking after signature verification).
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
