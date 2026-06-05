import { NextResponse } from "next/server";
import { syncScheduleFromLiveScore } from "@/lib/livescore/sync";

function authorize(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncScheduleFromLiveScore();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
