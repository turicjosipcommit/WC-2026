import { getDataClient } from "@/lib/supabase/data";
import { createAdminClient } from "@/lib/supabase/admin";

const SYNC_METADATA_ID = "default";

export async function recordLastSync(at = new Date()) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sync_metadata").upsert({
    id: SYNC_METADATA_ID,
    last_synced_at: at.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record sync time: ${error.message}`);
  }
}

export async function getLastSyncedAt(): Promise<Date | null> {
  const supabase = await getDataClient();
  const { data, error } = await supabase
    .from("sync_metadata")
    .select("last_synced_at")
    .eq("id", SYNC_METADATA_ID)
    .maybeSingle();

  if (error || !data?.last_synced_at) {
    return null;
  }

  return new Date(data.last_synced_at);
}
