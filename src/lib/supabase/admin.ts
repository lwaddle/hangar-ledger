import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service role privileges.
 * Use this ONLY for admin operations like inviting users.
 *
 * WARNING: This bypasses RLS - use carefully!
 *
 * For local development, you can get the service role key by running:
 * npx supabase status
 *
 * Add SUPABASE_SERVICE_ROLE_KEY to your .env.local
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Run 'npx supabase status' to get it."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
