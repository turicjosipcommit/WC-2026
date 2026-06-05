import { NextResponse } from "next/server";
import { syncResultsFromLiveScore } from "@/lib/livescore/sync";
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
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: decision.reason,
        activeMatches: decision.activeMatches.length,
      });
    }

    const result = await syncResultsFromLiveScore();
    return NextResponse.json({
      ok: true,
      skipped: false,
      reason: decision.reason,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
