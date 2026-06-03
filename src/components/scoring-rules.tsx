import { SCORING } from "@/lib/scoring";

export function ScoringRules() {
  return (
    <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/40 p-4 text-sm text-emerald-100/85">
      <p className="mb-2 font-semibold text-emerald-50">Scoring</p>
      <ul className="grid gap-1 sm:grid-cols-3">
        <li>Exact score: {SCORING.exact} pts</li>
        <li>Result + goal diff: {SCORING.resultAndDiff} pts</li>
        <li>Result only: {SCORING.resultOnly} pt</li>
      </ul>
      <p className="mt-2 text-emerald-200/70">
        Picks lock at kickoff. Results sync from SofaScore on a schedule.
      </p>
    </div>
  );
}
