import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No players yet. Invite your friends to sign up.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
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
              className="border-t border-slate-100"
            >
              <td className="px-4 py-3 text-emerald-700">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.display_name}
              </td>
              <td className="px-4 py-3 text-lg font-bold text-emerald-600">
                {row.total_points}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {row.predictions_count}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.exact_scores}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
