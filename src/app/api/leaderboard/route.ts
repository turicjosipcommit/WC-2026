import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();

  const [{ data: profiles, error: profilesError }, { data: predictions, error: predictionsError }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase
        .from("predictions")
        .select("user_id, points_awarded, pred_home, pred_away, matches(home_score, away_score, status)"),
    ]);

  if (profilesError || predictionsError) {
    return NextResponse.json(
      { error: profilesError?.message ?? predictionsError?.message },
      { status: 500 }
    );
  }

  const rows = new Map<string, LeaderboardRow>();

  for (const profile of profiles ?? []) {
    rows.set(profile.id, {
      user_id: profile.id,
      display_name: profile.display_name,
      total_points: 0,
      predictions_count: 0,
      exact_scores: 0,
    });
  }

  for (const prediction of predictions ?? []) {
    const row = rows.get(prediction.user_id);
    if (!row) continue;

    row.predictions_count += 1;
    row.total_points += prediction.points_awarded ?? 0;

    const matchRaw = prediction.matches;
    const match = (Array.isArray(matchRaw) ? matchRaw[0] : matchRaw) as {
      home_score: number | null;
      away_score: number | null;
      status: string;
    } | null;

    if (
      match?.status === "finished" &&
      match.home_score != null &&
      match.away_score != null &&
      prediction.pred_home === match.home_score &&
      prediction.pred_away === match.away_score
    ) {
      row.exact_scores += 1;
    }
  }

  const leaderboard = [...rows.values()].sort(
    (a, b) => b.total_points - a.total_points || b.exact_scores - a.exact_scores
  );

  return NextResponse.json({ leaderboard });
}
