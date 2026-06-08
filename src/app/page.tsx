import { Nav } from "@/components/nav";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { buildLeaderboardRows } from "@/lib/leaderboard";
import { getDataClient } from "@/lib/supabase/data";

async function getLeaderboard() {
  const supabase = await getDataClient();

  const [{ data: profiles }, { data: predictions }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("predictions").select("user_id, points_awarded, et_points_awarded, pen_points_awarded"),
  ]);

  return buildLeaderboardRows(profiles ?? [], predictions ?? []);
}

export default async function HomePage() {
  const leaderboard = await getLeaderboard();

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
        </div>
        <LeaderboardTable rows={leaderboard} />
      </main>
    </>
  );
}
