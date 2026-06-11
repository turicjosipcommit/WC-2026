"use client";

import { useCallback, useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { formatMatchCount } from "@/lib/i18n";
import type { LeaderboardMode } from "@/lib/leaderboard";
import type { LeaderboardRow } from "@/lib/types";

const LIVE_POLL_MS = 45_000;

type LeaderboardPanelProps = {
  initialOfficial: LeaderboardRow[];
  initialLive: LeaderboardRow[];
  initialLiveMatchCount: number;
};

type LeaderboardResponse = {
  mode: LeaderboardMode;
  liveMatchCount: number;
  leaderboard: LeaderboardRow[];
};

export function LeaderboardPanel({
  initialOfficial,
  initialLive,
  initialLiveMatchCount,
}: LeaderboardPanelProps) {
  const [mode, setMode] = useState<LeaderboardMode>("official");
  const [liveRows, setLiveRows] = useState(initialLive);
  const [liveMatchCount, setLiveMatchCount] = useState(initialLiveMatchCount);
  const [refreshing, setRefreshing] = useState(false);

  const rows = mode === "live" ? liveRows : initialOfficial;

  const refreshLiveLeaderboard = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/leaderboard?mode=live", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as LeaderboardResponse;
      setLiveRows(data.leaderboard);
      setLiveMatchCount(data.liveMatchCount);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "live") {
      return;
    }

    void refreshLiveLeaderboard();

    const intervalId = window.setInterval(() => {
      void refreshLiveLeaderboard();
    }, LIVE_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [mode, refreshLiveLeaderboard]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Vrsta ljestvice"
          className="inline-flex rounded-full bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "official"}
            onClick={() => setMode("official")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "official"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Službena
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "live"}
            onClick={() => setMode("live")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "live"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Uživo
          </button>
        </div>

        {mode === "live" && (
          <p className="text-sm text-slate-600">
            {liveMatchCount > 0 ? (
              <>
                <span className="font-medium text-emerald-700">UŽIVO</span>
                {" · "}
                {formatMatchCount(liveMatchCount)} u tijeku
                {refreshing ? " · osvježavanje…" : " · osvježava se automatski"}
              </>
            ) : (
              "Nema utakmica u tijeku — prikaz uključuje privremene bodove kad utakmice krenu."
            )}
          </p>
        )}
      </div>

      {mode === "live" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Privremena ljestvica uključuje bodove iz utakmica u tijeku, uključujući produžetak i
          penale kad su dostupni. Konačni poredak potvrđuje se nakon završetka utakmica.
        </p>
      )}

      <LeaderboardTable rows={rows} mode={mode} />
    </div>
  );
}
