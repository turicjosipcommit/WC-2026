import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw: string | undefined) {
  return raw?.trim().replace(/\/+$/, "") ?? "";
}

function requireSupabaseAdminEnv() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set."
    );
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Use the full Project URL from Supabase → Settings → API, e.g. https://algpcgabntzngujtloly.supabase.co"
    );
  }

  return { url, key };
}

export function createAdminClient() {
  const { url, key } = requireSupabaseAdminEnv();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
