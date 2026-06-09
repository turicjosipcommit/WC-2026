import { isAuthDisabled } from "@/lib/auth-config";
import {
  syncResultsFromLiveScore,
  syncScheduleFromLiveScore,
} from "@/lib/livescore/sync";
import { getLastSyncedAt } from "@/lib/sync-metadata";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireAuthenticatedUser() {
  if (isAuthDisabled()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niste autorizirani" }, { status: 401 });
  }

  return null;
}

export async function POST() {
  const authError = await requireAuthenticatedUser();
  if (authError) {
    return authError;
  }

  try {
    const schedule = await syncScheduleFromLiveScore();
    const results = await syncResultsFromLiveScore();
    const lastSyncedAt = await getLastSyncedAt();

    return NextResponse.json({
      ok: true,
      schedule,
      results,
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sinkronizacija nije uspjela";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
