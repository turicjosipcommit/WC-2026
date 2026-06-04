import { Suspense } from "react";
import { isAuthDisabled } from "@/lib/auth-config";
import { Nav } from "@/components/nav";
import { FixturesTabs } from "@/components/fixtures-tabs";
import { groupFixturesByRound } from "@/lib/fixtures-grouping";
import { createClient } from "@/lib/supabase/server";
import { getDataClient } from "@/lib/supabase/data";
import type { Match, Prediction } from "@/lib/types";

async function getFixtures() {
  const supabase = await getDataClient();
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
    user
      ? supabase.from("predictions").select("*").eq("user_id", user.id)
      : Promise.resolve({ data: [] as Prediction[] }),
  ]);

  const predictionByMatch = new Map(
    (predictions ?? []).map((p) => [p.match_id, p as Prediction])
  );

  return ((matches ?? []) as Match[]).map((match) => ({
    match,
    prediction: predictionByMatch.get(match.id) ?? null,
  }));
}

export default async function FixturesPage() {
  const fixtures = await getFixtures();
  const predictionsDisabled = isAuthDisabled();
  const roundGroups = groupFixturesByRound(fixtures);

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fixtures</h1>
          <p className="mt-1 text-slate-600">
            Enter your score predictions before kickoff.
            {fixtures.length > 0 &&
              ` ${fixtures.length} matches across ${roundGroups.length} rounds.`}
          </p>
        </div>

        {fixtures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            <p>No matches in the database yet.</p>
            <p className="mt-2 text-sm">
              Run <code className="rounded bg-slate-100 px-1 text-slate-800">npm run sync:schedule</code> after
              configuring Supabase and env vars.
            </p>
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading fixtures…</div>}>
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
