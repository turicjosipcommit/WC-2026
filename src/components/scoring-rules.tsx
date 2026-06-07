import { SCORING } from "@/lib/scoring";

export function ScoringRules() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
      <p className="mb-2 font-semibold text-slate-900">Scoring</p>
      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        <li>Exact score: {SCORING.exact} pts</li>
        <li>Result + one team score: {SCORING.resultAndOneTeam} pts</li>
        <li>Result only: {SCORING.resultOnly} pts</li>
        <li>One team score: {SCORING.oneTeamOnly} pt</li>
        <li>No points: {SCORING.none} pts</li>
      </ul>
      <p className="mt-2 text-slate-500">
        Picks lock at kickoff. Knockout matches also accept optional extra time and penalty
        shootout picks, scored with the same rules when those phases are played.
      </p>
    </div>
  );
}
