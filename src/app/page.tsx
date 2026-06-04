import { Nav } from "@/components/nav";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ScoringRules } from "@/components/scoring-rules";
import { getDataClient } from "@/lib/supabase/data";
import type { LeaderboardRow } from "@/lib/types";

async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = await getDataClient();

  const [{ data: profiles }, { data: predictions }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("predictions")
      .select("user_id, points_awarded, pred_home, pred_away, matches(home_score, away_score, status)"),
  ]);

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

  return [...rows.values()].sort(
    (a, b) => b.total_points - a.total_points || b.exact_scores - a.exact_scores
  );
}

export default async function HomePage() {
  const leaderboard = await getLeaderboard();

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="mt-1 text-slate-600">
            One group, ~15 friends, full tournament bragging rights.
          </p>
        </div>
        <ScoringRules />
        <LeaderboardTable rows={leaderboard} />
      </main>
    </>
  );
}
