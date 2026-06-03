import Link from "next/link";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";

export default async function MyPicksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-50">My picks</h1>
          <p className="mt-1 text-emerald-200/75">
            All predictions you have submitted so far.
          </p>
        </div>

        {(predictions ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-800/70 p-8 text-center text-emerald-200/75">
            <p>No picks yet.</p>
            <Link href="/fixtures" className="mt-3 inline-block text-emerald-300 underline">
              Go to fixtures
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {predictions!.map((prediction) => {
              const matchRaw = prediction.matches;
              const match = (Array.isArray(matchRaw) ? matchRaw[0] : matchRaw) as {
                home_team: string;
                away_team: string;
                kickoff_at: string;
                status: string;
                home_score: number | null;
                away_score: number | null;
              };

              return (
                <article
                  key={prediction.id}
                  className="rounded-2xl border border-emerald-900/50 bg-emerald-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-emerald-50">
                      {match.home_team} vs {match.away_team}
                    </p>
                    <p className="text-sm text-emerald-200/70">
                      {new Date(match.kickoff_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <p>
                      Pick:{" "}
                      <span className="font-semibold text-emerald-100">
                        {prediction.pred_home} - {prediction.pred_away}
                      </span>
                    </p>
                    {match.status === "finished" && match.home_score != null && (
                      <p>
                        Result: {match.home_score} - {match.away_score}
                      </p>
                    )}
                    {prediction.points_awarded != null && (
                      <p className="font-semibold text-emerald-300">
                        +{prediction.points_awarded} pts
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
