import Link from "next/link";
import { Suspense } from "react";
import { isAuthDisabled } from "@/lib/auth-config";
import { Nav } from "@/components/nav";
import { MyPicksTabs } from "@/components/my-picks-tabs";
import { groupPicksByRound, pickDefaultGroupKey } from "@/lib/fixtures-grouping";
import { formatPickCount, formatRoundCount } from "@/lib/i18n";
import { fetchMyPicks } from "@/lib/my-picks";

export default async function MyPicksPage() {
  const { picks, error, userId } = await fetchMyPicks();
  const roundGroups = groupPicksByRound(picks);
  const defaultRoundKey = pickDefaultGroupKey(roundGroups);

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Moje prognoze</h1>
          <p className="mt-1 text-slate-600">
            Sve prognoze koje ste dosad poslali.
            {picks.length > 0 &&
              ` ${formatPickCount(picks.length)} u ${formatRoundCount(roundGroups.length)}.`}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!userId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            <p>Prijavite se za pregled svojih prognoza.</p>
            <Link href="/login" className="mt-3 inline-block text-emerald-700 underline">
              Idi na prijavu
            </Link>
          </div>
        ) : picks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            <p>
              {isAuthDisabled()
                ? "Prijava je isključena — prijavite se kasnije za spremanje i pregled prognoza."
                : "Još nema prognoza za vaš račun."}
            </p>
            {!isAuthDisabled() && (
              <p className="mt-2 text-xs text-slate-500">
                Prognoze u bazi moraju koristiti vaš korisnički ID ({userId.slice(0, 8)}…)
                da bi se prikazali ovdje.
              </p>
            )}
            <Link href="/fixtures" className="mt-3 inline-block text-emerald-700 underline">
              Idi na utakmice
            </Link>
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Učitavanje prognoza…</div>}>
            <MyPicksTabs
              groups={roundGroups}
              defaultRoundKey={defaultRoundKey}
              predictionsDisabled={isAuthDisabled()}
            />
          </Suspense>
        )}
      </main>
    </>
  );
}
