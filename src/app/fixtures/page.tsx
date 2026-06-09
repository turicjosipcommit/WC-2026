import { Suspense } from "react";
import { isAuthDisabled } from "@/lib/auth-config";
import { Nav } from "@/components/nav";
import { FixturesTabs } from "@/components/fixtures-tabs";
import { SyncDataButton } from "@/components/sync-data-button";
import {
  groupFixturesByRound,
  groupOtherPicksByMatch,
} from "@/lib/fixtures-grouping";
import { canRevealOtherPicks } from "@/lib/match-phase";
import { getLastSyncedAt } from "@/lib/sync-metadata";
import { createClient } from "@/lib/supabase/server";
import { getDataClient } from "@/lib/supabase/data";
import { formatMatchCount, formatRoundCount } from "@/lib/i18n";
import type { Match, MatchGoal, Prediction } from "@/lib/types";

async function getFixtures() {
  const supabase = await getDataClient();
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const [
    { data: matches },
    { data: matchGoals },
    { data: userPredictions },
    { data: allPredictions },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
    supabase.from("match_goals").select("*").order("sort_order", { ascending: true }),
    user
      ? supabase.from("predictions").select("*").eq("user_id", user.id)
      : Promise.resolve({ data: [] as Prediction[] }),
    supabase
      .from("predictions")
      .select(
        "user_id, match_id, pred_home, pred_away, pred_et_home, pred_et_away, pred_pen_home, pred_pen_away, points_awarded, et_points_awarded, pen_points_awarded"
      ),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const predictionByMatch = new Map(
    (userPredictions ?? []).map((p) => [p.match_id, p as Prediction])
  );
  const otherPicksByMatch = groupOtherPicksByMatch(
    (allPredictions ?? []) as Prediction[],
    profiles ?? [],
    user?.id
  );
  const goalsByMatch = new Map<string, MatchGoal[]>();
  for (const goal of (matchGoals ?? []) as MatchGoal[]) {
    const list = goalsByMatch.get(goal.match_id) ?? [];
    list.push(goal);
    goalsByMatch.set(goal.match_id, list);
  }

  return ((matches ?? []) as Match[]).map((match) => ({
    match,
    prediction: predictionByMatch.get(match.id) ?? null,
    otherPicks: canRevealOtherPicks(match)
      ? (otherPicksByMatch.get(match.id) ?? [])
      : [],
    goals: goalsByMatch.get(match.id) ?? [],
  }));
}

export default async function FixturesPage() {
  const [fixtures, lastSyncedAt] = await Promise.all([getFixtures(), getLastSyncedAt()]);
  const predictionsDisabled = isAuthDisabled();
  const roundGroups = groupFixturesByRound(fixtures);

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-slate-900">Utakmice</h1>
            <SyncDataButton
              className="shrink-0"
              lastSyncedAt={lastSyncedAt?.toISOString() ?? null}
            />
          </div>
          <p className="mt-1 text-slate-600">
            Unesite prognoze rezultata prije početka utakmice.
            {fixtures.length > 0 &&
              ` ${formatMatchCount(fixtures.length)} u ${formatRoundCount(roundGroups.length)}.`}
          </p>
        </div>

        {fixtures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            <p>Još nema utakmica u bazi.</p>
            <p className="mt-2 text-sm">
              Sinkronizirajte utakmice s LiveScorea ili lokalno pokrenite{" "}
              <code className="rounded bg-slate-100 px-1 text-slate-800">npm run sync:schedule</code>.
            </p>
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Učitavanje utakmica…</div>}>
            <FixturesTabs
              groups={roundGroups}
              predictionsDisabled={predictionsDisabled}
            />
          </Suspense>
        )}
      </main>
    </>
  );
}
