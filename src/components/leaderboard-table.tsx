import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-emerald-800/70 p-8 text-center text-emerald-200/70">
        No players yet. Invite your friends to sign up.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-900/50">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-emerald-950/80 text-emerald-200/70">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium">Points</th>
            <th className="px-4 py-3 font-medium">Picks</th>
            <th className="px-4 py-3 font-medium">Exact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.user_id}
              className="border-t border-emerald-900/40 bg-emerald-950/30"
            >
              <td className="px-4 py-3 text-emerald-300">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-emerald-50">
                {row.display_name}
              </td>
              <td className="px-4 py-3 text-lg font-bold text-emerald-300">
                {row.total_points}
              </td>
              <td className="px-4 py-3 text-emerald-100/80">
                {row.predictions_count}
              </td>
              <td className="px-4 py-3 text-emerald-100/80">{row.exact_scores}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
