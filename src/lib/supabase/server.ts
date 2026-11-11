import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Read-only client (publishable key, RLS applies). Null when env vars are missing. */
export function getPublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, opts);
}

/** Admin client (secret key, bypasses RLS). Server-side only. Null when env vars are missing. */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, opts);
}
