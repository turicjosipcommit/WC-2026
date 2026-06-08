import {
  KNOCKOUT_ET_POINTS,
  KNOCKOUT_PEN_POINTS,
  SCORING,
} from "@/lib/scoring";

function RuleExample({
  title,
  actual,
  pick,
  points,
}: {
  title: string;
  actual: string;
  pick: string;
  points: string;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Actual:</span> {actual}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Your pick:</span> {pick}
      </p>
      <p className="mt-2 text-sm font-semibold text-emerald-700">{points}</p>
    </li>
  );
}

export function ScoringRulesContent() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Regular time (90′)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every match is scored on the full-time score after 90 minutes.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Exact score: <span className="font-semibold">{SCORING.exact} pts</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Result + one team score:{" "}
            <span className="font-semibold">{SCORING.resultAndOneTeam} pts</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Result only: <span className="font-semibold">{SCORING.resultOnly} pts</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            One team score: <span className="font-semibold">{SCORING.oneTeamOnly} pt</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            No points: <span className="font-semibold">{SCORING.none} pts</span>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Knockout extra time &amp; penalties
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Optional picks for knockout matches. Bonus points apply only if your{" "}
          <span className="font-medium text-slate-800">90′ pick is exact</span>. ET and
          penalty points are added on top of regular-time points.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">When it applies</th>
                <th className="px-4 py-3 font-medium">ET</th>
                <th className="px-4 py-3 font-medium">Pens</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+1</td>
                <td className="px-4 py-3">Exact 90′, ET outcome only (not exact ET score)</td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.outcomeOnly}</td>
                <td className="px-4 py-3">—</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+1+1</td>
                <td className="px-4 py-3">Exact 90′, ET outcome, penalty winner</td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.outcomeOnly}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.outcome}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+1+2</td>
                <td className="px-4 py-3">Exact 90′, ET outcome, exact penalty score</td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.outcomeOnly}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.exact}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+2+1</td>
                <td className="px-4 py-3">
                  Exact 90′, ET score unchanged from 90′, penalty winner
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.sameScoreAs90}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.outcome}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+2+2</td>
                <td className="px-4 py-3">
                  Exact 90′, ET score unchanged from 90′, exact penalty score
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.sameScoreAs90}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.exact}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+3</td>
                <td className="px-4 py-3">
                  Exact 90′, you pick a win in ET and the match ends there (no pens)
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin}</td>
                <td className="px-4 py-3">—</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+3+1</td>
                <td className="px-4 py-3">
                  Exact 90′, ET ends in a different draw, penalty winner
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.outcome}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+3+2</td>
                <td className="px-4 py-3">
                  Exact 90′, ET ends in a different draw, exact penalty score
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.exact}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          ET outcome means who wins extra time as a standalone period: home win, away win,
          or draw. It is separate from the penalty shootout winner.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Examples</h2>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          <RuleExample
            title="+1 — ET outcome only"
            actual="1–1 → ET 2–1 home (no pens)"
            pick="90′ 1–1, ET 3–0 home"
            points="90′: 4 pts · ET: +1 · Total bonus: 1"
          />
          <RuleExample
            title="+2+2 — same ET score as 90′"
            actual="1–1 → ET 1–1 → pens 4–3 home"
            pick="90′ 1–1, ET 1–1, pens 4–3"
            points="90′: 4 pts · ET: +2 · Pens: +2 · Total bonus: 4"
          />
          <RuleExample
            title="+1+1 — ET draw outcome, pen winner"
            actual="1–1 → ET 1–1 → pens 4–3 home"
            pick="90′ 1–1, ET 0–0, pens home win (wrong pen score)"
            points="90′: 4 pts · ET: +1 · Pens: +1 · Total bonus: 2"
          />
          <RuleExample
            title="+3 — win in ET, no pens"
            actual="1–1 → ET 2–1 home"
            pick="90′ 1–1, ET 2–1 (or any home win in ET)"
            points="90′: 4 pts · ET: +3 · Total bonus: 3"
          />
          <RuleExample
            title="+3+2 — different draw in ET"
            actual="1–1 → ET 2–2 → pens 5–4 home"
            pick="90′ 1–1, ET 2–2, pens 5–4"
            points="90′: 4 pts · ET: +3 · Pens: +2 · Total bonus: 5"
          />
          <RuleExample
            title="No ET/pen bonus without exact 90′"
            actual="1–1 → ET 1–1 → pens 4–3 home"
            pick="90′ 2–1, ET 1–1, pens 4–3"
            points="90′: 0 pts · ET: 0 · Pens: 0"
          />
        </ul>
      </section>

      <p className="text-sm text-slate-500">
        Picks lock at kickoff. Knockout ET and penalty picks are optional but only score
        when those phases are actually played.
      </p>
    </div>
  );
}
