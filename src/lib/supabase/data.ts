import { isAuthDisabled } from "@/lib/auth-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Server reads: admin client when auth is disabled (bypasses RLS for local dev). */
export async function getDataClient() {
  if (isAuthDisabled()) {
    return createAdminClient();
  }
  return createClient();
}
