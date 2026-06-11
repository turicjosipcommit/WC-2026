import { Nav } from "@/components/nav";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { buildLeaderboardRows } from "@/lib/leaderboard";
import { fetchLeaderboardInput } from "@/lib/leaderboard-data";
import { getDataClient } from "@/lib/supabase/data";

async function getLeaderboardData() {
  const supabase = await getDataClient();
  const { profiles, predictions, liveMatchCount } = await fetchLeaderboardInput(supabase);

  return {
    official: buildLeaderboardRows(profiles, predictions, "official"),
    live: buildLeaderboardRows(profiles, predictions, "live"),
    liveMatchCount,
  };
}

export default async function HomePage() {
  const { official, live, liveMatchCount } = await getLeaderboardData();

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ljestvica</h1>
        </div>
        <LeaderboardPanel
          initialOfficial={official}
          initialLive={live}
          initialLiveMatchCount={liveMatchCount}
        />
      </main>
    </>
  );
}
