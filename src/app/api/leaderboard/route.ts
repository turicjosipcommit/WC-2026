import { NextResponse } from "next/server";
import { buildLeaderboardRows, type LeaderboardMode } from "@/lib/leaderboard";
import { fetchLeaderboardInput } from "@/lib/leaderboard-data";
import { getDataClient } from "@/lib/supabase/data";

function parseMode(value: string | null): LeaderboardMode {
  return value === "live" ? "live" : "official";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = parseMode(searchParams.get("mode"));

  try {
    const supabase = await getDataClient();
    const { profiles, predictions, liveMatchCount } = await fetchLeaderboardInput(supabase);
    const leaderboard = buildLeaderboardRows(profiles, predictions, mode);

    return NextResponse.json({
      mode,
      liveMatchCount,
      leaderboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
