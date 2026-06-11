import { LeaderboardTableRow } from "@/components/leaderboard-table-row";
import type { LeaderboardMode } from "@/lib/leaderboard";
import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({
  rows,
  mode = "official",
}: {
  rows: LeaderboardRow[];
  mode?: LeaderboardMode;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Još nema igrača. Pozovite prijatelje da se prijave.
      </p>
    );
  }

  return (
    <div className="horizontal-scroll min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Igrač</th>
            <th className="px-4 py-3 font-medium">Bodovi</th>
            <th className="px-4 py-3 font-medium">Prognoze</th>
            <th className="px-4 py-3 font-medium">Točno</th>
            <th className="px-4 py-3 font-medium">Ishod</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <LeaderboardTableRow key={row.user_id} row={row} index={index} mode={mode} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
