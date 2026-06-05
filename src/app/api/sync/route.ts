import { isAuthDisabled } from "@/lib/auth-config";
import {
  syncResultsFromLiveScore,
  syncScheduleFromLiveScore,
} from "@/lib/livescore/sync";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      ok: true,
      schedule,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
