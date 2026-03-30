import { createClient } from "@supabase/supabase-js";

/**
 * WARNING: This client uses the SERVICE_ROLE_KEY which bypasses all RLS policies.
 * ONLY use this in Server Actions or Route Handlers after verifying the user's 
 * identity and administrative permissions.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase Admin Environment Variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
