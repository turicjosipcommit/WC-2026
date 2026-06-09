import { NextResponse } from "next/server";
import { syncResultsFromLiveScore, syncScheduleFromLiveScore } from "@/lib/livescore/sync";
import { getLastSyncedAt, recordLastSync } from "@/lib/sync-metadata";
import { evaluateResultsSync } from "@/lib/sync-window";

function authorize(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force =
      searchParams.get("force") === "1" ||
      request.headers.get("x-sync-force") === "1";

    const decision = await evaluateResultsSync({ force });
    if (!decision.run) {
      await recordLastSync();
      const lastSyncedAt = await getLastSyncedAt();

      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: decision.reason,
        activeMatches: decision.activeMatches.length,
        lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
      });
    }

    let schedule: Awaited<ReturnType<typeof syncScheduleFromLiveScore>> | undefined;
    if (decision.reason === "fallback") {
      try {
        schedule = await syncScheduleFromLiveScore();
      } catch (scheduleError) {
        console.warn("Schedule sync failed during fallback:", scheduleError);
      }
    }

    const result = await syncResultsFromLiveScore();
    const lastSyncedAt = await getLastSyncedAt();

    return NextResponse.json({
      ok: true,
      skipped: false,
      reason: decision.reason,
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
      schedule,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
