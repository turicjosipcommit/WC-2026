import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PLAYER_NAME } from "@/lib/i18n";
import { resolveDisplayName } from "@/lib/profile-display-name";

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const displayName =
    resolveDisplayName(user.user_metadata, user.email) ?? DEFAULT_PLAYER_NAME;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    { onConflict: "id" }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
