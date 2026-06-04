"use client";

import { useState } from "react";
import type { OtherPick } from "@/lib/fixtures-grouping";
import {
  formatPredictionSummary,
  formatScoreLine,
  hasScoredPrediction,
  isKnockoutMatch,
  totalPredictionPoints,
} from "@/lib/match-phase";
import type { Match, Prediction } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction | null;
  otherPicks?: OtherPick[];
  predictionsDisabled?: boolean;
}

function ScoreInputRow({
  label,
  home,
  away,
  onHomeChange,
  onAwayChange,
  optional = false,
}: {
  label: string;
  home: string;
  away: string;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <p className="w-full text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {optional ? " (optional)" : ""}
      </p>
      <label className="grid gap-1 text-sm text-slate-600">
        Home
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => onHomeChange(e.target.value)}
          className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />
      </label>
      <label className="grid gap-1 text-sm text-slate-600">
        Away
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => onAwayChange(e.target.value)}
          className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />
      </label>
    </div>
  );
}

function optionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

function otherPickSummary(pick: OtherPick) {
  return formatPredictionSummary({
    pred_home: pick.predHome,
    pred_away: pick.predAway,
    pred_et_home: pick.predEtHome,
    pred_et_away: pick.predEtAway,
    pred_pen_home: pick.predPenHome,
    pred_pen_away: pick.predPenAway,
  });
}

function otherPickPoints(pick: OtherPick) {
  return (
    (pick.pointsAwarded ?? 0) +
    (pick.etPointsAwarded ?? 0) +
    (pick.penPointsAwarded ?? 0)
  );
}

export function MatchCard({
  match,
  prediction,
  otherPicks = [],
  predictionsDisabled = false,
}: MatchCardProps) {
  const knockout = isKnockoutMatch(match);
  const locked =
    predictionsDisabled ||
    new Date(match.kickoff_at) <= new Date() ||
    !["scheduled", "postponed"].includes(match.status);

  const [home, setHome] = useState(String(prediction?.pred_home ?? ""));
  const [away, setAway] = useState(String(prediction?.pred_away ?? ""));
  const [etHome, setEtHome] = useState(String(prediction?.pred_et_home ?? ""));
  const [etAway, setEtAway] = useState(String(prediction?.pred_et_away ?? ""));
  const [penHome, setPenHome] = useState(String(prediction?.pred_pen_home ?? ""));
  const [penAway, setPenAway] = useState(String(prediction?.pred_pen_away ?? ""));
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
        predEtHome: optionalNumber(etHome),
        predEtAway: optionalNumber(etAway),
        predPenHome: optionalNumber(penHome),
        predPenAway: optionalNumber(penAway),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      const errorText = data.error ?? "Could not save prediction";
      setMessage(
        errorText.includes("predictions_user_id_fkey")
          ? "Your player profile is missing. Sign out, sign in again, then retry."
          : errorText
      );
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

  const ftScore = formatScoreLine(
    match.home_score_90 ?? match.home_score,
    match.away_score_90 ?? match.away_score
  );
  const etScore = formatScoreLine(match.home_score_et, match.away_score_et);
  const penScore = formatScoreLine(match.home_score_pen, match.away_score_pen);
  const userPoints = prediction ? totalPredictionPoints(prediction) : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {match.group_name ? `${match.group_name} · ` : ""}
          {match.stage}
          {match.round_number ? ` · MD ${match.round_number}` : ""}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-wide text-slate-600">
          {match.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{match.home_team}</p>
          {match.status === "finished" && ftScore && (
            <p className="text-3xl font-bold text-emerald-600">{ftScore.split(" - ")[0]}</p>
          )}
        </div>

        <div className="text-center text-sm text-slate-500">
          <p>{kickoff}</p>
          {match.status === "finished" ? (
            <div className="mt-1 space-y-0.5">
              <p className="text-xl font-bold text-slate-700">FT</p>
              {match.went_to_extra_time && etScore && (
                <p className="text-xs text-slate-500">AET {etScore}</p>
              )}
              {match.went_to_penalties && penScore && (
                <p className="text-xs text-slate-500">Pens {penScore}</p>
              )}
            </div>
          ) : (
            <p className="mt-1">vs</p>
          )}
        </div>

        <div className="sm:text-right">
          <p className="text-lg font-semibold text-slate-900">{match.away_team}</p>
          {match.status === "finished" && ftScore && (
            <p className="text-3xl font-bold text-emerald-600">{ftScore.split(" - ")[1]}</p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        {locked ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-slate-600">
              {predictionsDisabled ? (
                "Login is disabled — predictions are read-only for now."
              ) : (
                <>
                  Your pick:{" "}
                  <span className="font-semibold text-slate-900">
                    {prediction
                      ? formatPredictionSummary(prediction)
                      : "No prediction"}
                  </span>
                </>
              )}
            </p>
            {!predictionsDisabled && prediction && hasScoredPrediction(prediction) && (
              <p className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                +{userPoints} pts
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <ScoreInputRow
              label="Full time"
              home={home}
              away={away}
              onHomeChange={setHome}
              onAwayChange={setAway}
            />
            {knockout && (
              <>
                <ScoreInputRow
                  label="Extra time"
                  home={etHome}
                  away={etAway}
                  onHomeChange={setEtHome}
                  onAwayChange={setEtAway}
                  optional
                />
                <ScoreInputRow
                  label="Penalties"
                  home={penHome}
                  away={penAway}
                  onHomeChange={setPenHome}
                  onAwayChange={setPenAway}
                  optional
                />
              </>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving || home === "" || away === ""}
                onClick={savePrediction}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save pick"}
              </button>
              {message && (
                <p className={`text-sm ${message === "Saved" ? "text-emerald-600" : "text-red-600"}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {otherPicks.length > 0 && (
        <details className="mt-4 border-t border-slate-100 pt-3">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-600 hover:text-slate-900">
            Other picks ({otherPicks.length})
          </summary>
          <ul className="mt-2 grid gap-1.5">
            {otherPicks.map((pick) => (
              <li
                key={pick.userId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{pick.displayName}</span>
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="font-semibold text-slate-900">{otherPickSummary(pick)}</span>
                  {(pick.pointsAwarded != null ||
                    pick.etPointsAwarded != null ||
                    pick.penPointsAwarded != null) && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      +{otherPickPoints(pick)} pts
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
