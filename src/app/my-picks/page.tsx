import Link from "next/link";
import { Suspense } from "react";
import { isAuthDisabled } from "@/lib/auth-config";
import { Nav } from "@/components/nav";
import { MyPicksTabs } from "@/components/my-picks-tabs";
import { groupPicksByRound, pickDefaultGroupKey } from "@/lib/fixtures-grouping";
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
          <h1 className="text-3xl font-bold text-slate-900">My picks</h1>
          <p className="mt-1 text-slate-600">
            All predictions you have submitted so far.
            {picks.length > 0 &&
              ` ${picks.length} picks across ${roundGroups.length} rounds.`}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!userId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            <p>Sign in to view your picks.</p>
            <Link href="/login" className="mt-3 inline-block text-emerald-700 underline">
              Go to login
            </Link>
          </div>
        ) : picks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            <p>
              {isAuthDisabled()
                ? "Login is disabled — sign in later to save and view your picks."
                : "No picks yet for your account."}
            </p>
            {!isAuthDisabled() && (
              <p className="mt-2 text-xs text-slate-500">
                Picks in the database must use your user id ({userId.slice(0, 8)}…)
                to appear here.
              </p>
            )}
            <Link href="/fixtures" className="mt-3 inline-block text-emerald-700 underline">
              Go to fixtures
            </Link>
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading picks…</div>}>
            <MyPicksTabs groups={roundGroups} defaultRoundKey={defaultRoundKey} />
          </Suspense>
        )}
      </main>
    </>
  );
}
