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
        <span className="font-medium text-slate-700">Stvarno:</span> {actual}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Vaša prognoza:</span> {pick}
      </p>
      <p className="mt-2 text-sm font-semibold text-emerald-700">{points}</p>
    </li>
  );
}

export function ScoringRulesContent() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Regularno vrijeme (90′)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Svaka utakmica se boduje prema rezultatu nakon 90 minuta.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Točan rezultat: <span className="font-semibold">{SCORING.exact} b</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Ishod + jedan rezultat momčadi:{" "}
            <span className="font-semibold">{SCORING.resultAndOneTeam} b</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Samo ishod: <span className="font-semibold">{SCORING.resultOnly} b</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Jedan rezultat momčadi: <span className="font-semibold">{SCORING.oneTeamOnly} b</span>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Bez bodova: <span className="font-semibold">{SCORING.none} b</span>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Produžetak i penali u nokaut fazama
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Neobavezne prognoze za nokaut utakmice. Bonus bodovi vrijede samo ako je vaša{" "}
          <span className="font-medium text-slate-800">90′ prognoza točna</span>. Bodovi za
          produžetak i penale dodaju se na regularno vrijeme.
        </p>

        <div className="horizontal-scroll mt-4 min-w-0 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Pravilo</th>
                <th className="px-4 py-3 font-medium">Kada vrijedi</th>
                <th className="px-4 py-3 font-medium">Prod.</th>
                <th className="px-4 py-3 font-medium">Pen.</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+1</td>
                <td className="px-4 py-3">Točan 90′, samo ishod produžetka (ne točan rezultat)</td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.outcomeOnly}</td>
                <td className="px-4 py-3">—</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+1+1</td>
                <td className="px-4 py-3">Točan 90′, ishod produžetka, pobjednik na penalima</td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.outcomeOnly}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.outcome}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+1+2</td>
                <td className="px-4 py-3">Točan 90′, ishod produžetka, točan rezultat na penalima</td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.outcomeOnly}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.exact}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+2+1</td>
                <td className="px-4 py-3">
                  Točan 90′, ukupni rezultat nakon produžetka isti kao u 90′, pobjednik na
                  penalima
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.sameScoreAs90}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.outcome}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+2+2</td>
                <td className="px-4 py-3">
                  Točan 90′, ukupni rezultat nakon produžetka isti kao u 90′, točan rezultat na
                  penalima
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.sameScoreAs90}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.exact}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+3</td>
                <td className="px-4 py-3">
                  Točan 90′, prognoza na pobjedu u produžetku i utakmica završava tamo (bez penala)
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin}</td>
                <td className="px-4 py-3">—</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+3+1</td>
                <td className="px-4 py-3">
                  Točan 90′, točan ukupni neriješen rezultat u produžetku (npr. 1–1 → 2–2),
                  pobjednik na penalima
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.outcome}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">+3+2</td>
                <td className="px-4 py-3">
                  Točan 90′, točan ukupni neriješen rezultat u produžetku (npr. 1–1 → 2–2),
                  točan rezultat na penalima
                </td>
                <td className="px-4 py-3">{KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin}</td>
                <td className="px-4 py-3">{KNOCKOUT_PEN_POINTS.exact}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Produžetak unosite kao{" "}
          <span className="font-medium text-slate-700">ukupni rezultat na kraju produžetka</span>,
          ne kao golove samo u produžetku. Npr. 90′ 1–1, pa po jedan gol u produžetku → prod.{" "}
          <span className="font-medium text-slate-700">2–2</span>, ne 1–1. Ishod produžetka je
          tko pobjeđuje u toj fazi (pobjeda domaćina, pobjeda gosta ili neriješeno) — odvojeno
          od pobjednika na penalima.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Primjeri</h2>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          <RuleExample
            title="+1 — samo ishod produžetka"
            actual="1–1 → prod. 1–1 → pen. 4–3 domaćin"
            pick="90′ 1–1, prod. 2–2 (krivi rezultat, ali neriješeno u produžetku)"
            points="90′: 4 b · Prod.: +1 · Ukupni bonus: 1"
          />
          <RuleExample
            title="+2+2 — ukupni rezultat nakon produžetka isti kao u 90′"
            actual="1–1 → prod. 1–1 → pen. 4–3 domaćin"
            pick="90′ 1–1, prod. 1–1, pen. 4–3"
            points="90′: 4 b · Prod.: +2 · Pen.: +2 · Ukupni bonus: 4"
          />
          <RuleExample
            title="+2+1 — isti ukupni rezultat u produžetku, krivi penali"
            actual="1–1 → prod. 1–1 → pen. 4–3 domaćin"
            pick="90′ 1–1, prod. 1–1, pen. 5–4 (točan pobjednik, krivi rezultat)"
            points="90′: 4 b · Prod.: +2 · Pen.: +1 · Ukupni bonus: 3"
          />
          <RuleExample
            title="+1+1 — neriješeno u produžetku, pobjednik na penalima"
            actual="1–1 → prod. 1–1 → pen. 4–3 domaćin"
            pick="90′ 1–1, prod. 2–2, pen. 5–4 (krivi rezultat penala, točan pobjednik)"
            points="90′: 4 b · Prod.: +1 · Pen.: +1 · Ukupni bonus: 2"
          />
          <RuleExample
            title="+1+2 — krivi produžetak, točni penali"
            actual="1–1 → prod. 1–1 → pen. 4–3 domaćin"
            pick="90′ 1–1, prod. 2–2, pen. 4–3"
            points="90′: 4 b · Prod.: +1 · Pen.: +2 · Ukupni bonus: 3"
          />
          <RuleExample
            title="+3 — pobjeda u produžetku, bez penala"
            actual="1–1 → prod. 2–1 domaćin"
            pick="90′ 1–1, prod. 3–1 (krivi rezultat, ali točna pobjeda domaćina)"
            points="90′: 4 b · Prod.: +3 · Ukupni bonus: 3"
          />
          <RuleExample
            title="+3+2 — drugi neriješeni ukupni rezultat u produžetku"
            actual="1–1 → prod. 2–2 → pen. 5–4 domaćin"
            pick="90′ 1–1, prod. 2–2, pen. 5–4"
            points="90′: 4 b · Prod.: +3 · Pen.: +2 · Ukupni bonus: 5"
          />
          <RuleExample
            title="+3+1 — točan produžetak, krivi penali"
            actual="1–1 → prod. 2–2 → pen. 5–4 domaćin"
            pick="90′ 1–1, prod. 2–2, pen. 6–5 (točan pobjednik, krivi rezultat)"
            points="90′: 4 b · Prod.: +3 · Pen.: +1 · Ukupni bonus: 4"
          />
          <RuleExample
            title="Bez bonusa za prod./pen. bez točnog 90′"
            actual="1–1 → prod. 1–1 → pen. 4–3 domaćin"
            pick="90′ 2–0, prod. 1–1, pen. 4–3"
            points="90′: 0 b · Prod.: 0 · Pen.: 0 (bonus zahtijeva točan 90′)"
          />
        </ul>
      </section>

      <p className="text-sm text-slate-500">
        Prognoze se zaključavaju na početak utakmice. Prognoze za produžetak i penale su neobavezne,
        ali se boduju samo ako se te faze stvarno odigraju.
      </p>
    </div>
  );
}
