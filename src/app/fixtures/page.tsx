import { Nav } from "@/components/nav";
import { MatchCard } from "@/components/match-card";
import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction } from "@/lib/types";

async function getFixtures() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const rounds = [...new Set(fixtures.map((f) => f.match.round_number).filter(Boolean))];

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-50">Fixtures</h1>
          <p className="mt-1 text-emerald-200/75">
            Enter your score predictions before kickoff.
            {rounds.length > 0 && ` ${fixtures.length} matches loaded.`}
          </p>
        </div>

        {fixtures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-800/70 p-8 text-emerald-200/75">
            <p>No matches in the database yet.</p>
            <p className="mt-2 text-sm">
              Run <code className="rounded bg-emerald-950 px-1">npm run sync:schedule</code> after
              configuring Supabase and env vars.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {fixtures.map(({ match, prediction }) => (
              <MatchCard key={match.id} match={match} prediction={prediction} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
