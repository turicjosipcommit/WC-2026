"use client";

import { useState } from "react";
import type { Match, Prediction } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction | null;
}

export function MatchCard({ match, prediction }: MatchCardProps) {
  const locked =
    new Date(match.kickoff_at) <= new Date() ||
    !["scheduled", "postponed"].includes(match.status);

  const [home, setHome] = useState(String(prediction?.pred_home ?? ""));
  const [away, setAway] = useState(String(prediction?.pred_away ?? ""));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePrediction() {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        predHome: Number(home),
        predAway: Number(away),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not save prediction");
      return;
    }

    setMessage("Saved");
  }

  const kickoff = new Date(match.kickoff_at).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-2xl border border-emerald-900/50 bg-emerald-950/50 p-4 shadow-lg shadow-black/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200/70">
        <span>
          {match.group_name ? `${match.group_name} · ` : ""}
          {match.stage}
          {match.round_number ? ` · MD ${match.round_number}` : ""}
        </span>
        <span className="rounded-full bg-emerald-900/70 px-2 py-1 uppercase tracking-wide">
          {match.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-lg font-semibold text-emerald-50">{match.home_team}</p>
          {match.status === "finished" && (
            <p className="text-3xl font-bold text-emerald-300">{match.home_score}</p>
          )}
        </div>

        <div className="text-center text-sm text-emerald-200/60">
          <p>{kickoff}</p>
          {match.status === "finished" ? (
            <p className="mt-1 text-xl font-bold text-emerald-100">FT</p>
          ) : (
            <p className="mt-1">vs</p>
          )}
        </div>

        <div className="sm:text-right">
          <p className="text-lg font-semibold text-emerald-50">{match.away_team}</p>
          {match.status === "finished" && (
            <p className="text-3xl font-bold text-emerald-300">{match.away_score}</p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-emerald-900/40 pt-4">
        {locked ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-emerald-200/80">
              Your pick:{" "}
              <span className="font-semibold text-emerald-50">
                {prediction
                  ? `${prediction.pred_home} - ${prediction.pred_away}`
                  : "No prediction"}
              </span>
            </p>
            {prediction?.points_awarded != null && (
              <p className="rounded-full bg-emerald-800/80 px-3 py-1 font-semibold text-emerald-50">
                +{prediction.points_awarded} pts
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm text-emerald-200/80">
              Home
              <input
                type="number"
                min={0}
                max={20}
                value={home}
                onChange={(e) => setHome(e.target.value)}
                className="w-20 rounded-lg border border-emerald-800 bg-emerald-950 px-3 py-2 text-emerald-50"
              />
            </label>
            <label className="grid gap-1 text-sm text-emerald-200/80">
              Away
              <input
                type="number"
                min={0}
                max={20}
                value={away}
                onChange={(e) => setAway(e.target.value)}
                className="w-20 rounded-lg border border-emerald-800 bg-emerald-950 px-3 py-2 text-emerald-50"
              />
            </label>
            <button
              type="button"
              disabled={saving || home === "" || away === ""}
              onClick={savePrediction}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save pick"}
            </button>
            {message && <p className="text-sm text-emerald-200">{message}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
