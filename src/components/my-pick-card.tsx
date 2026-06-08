"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PredictionEditor } from "@/components/prediction-editor";
import { TeamLabel } from "@/components/team-label";
import {
  formatPredictionSummary,
  formatScoreLine,
  hasScoredPrediction,
  isPredictionLocked,
  totalPredictionPoints,
} from "@/lib/match-phase";
import type { Match, Prediction } from "@/lib/types";

type MyPickCardProps = {
  match: Match;
  prediction: Prediction;
  predictionsDisabled?: boolean;
};

export function MyPickCard({
  match,
  prediction,
  predictionsDisabled = false,
}: MyPickCardProps) {
  const router = useRouter();
  const locked = isPredictionLocked(match, predictionsDisabled);
  const [editing, setEditing] = useState(false);

  const ftResult = formatScoreLine(
    match.home_score_90 ?? match.home_score,
    match.away_score_90 ?? match.away_score
  );

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-medium text-slate-900">
          <TeamLabel name={match.home_team} img={match.home_team_img} />
          <span className="text-slate-400">vs</span>
          <TeamLabel name={match.away_team} img={match.away_team_img} />
        </p>
        <p className="text-sm text-slate-500">
          {new Date(match.kickoff_at).toLocaleString()}
        </p>
      </div>

      {editing && !locked ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <PredictionEditor
            match={match}
            prediction={prediction}
            showCancel
            saveLabel="Update pick"
            onCancel={() => setEditing(false)}
            onSaved={handleSaved}
          />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap gap-4">
            <p>
              Pick:{" "}
              <span className="font-semibold text-slate-900">
                {formatPredictionSummary(prediction)}
              </span>
            </p>
            {match.status === "finished" && ftResult && (
              <p className="text-slate-600">FT: {ftResult}</p>
            )}
            {match.status === "finished" && match.went_to_extra_time && (
              <p className="text-slate-600">
                AET: {formatScoreLine(match.home_score_et, match.away_score_et)}
              </p>
            )}
            {match.status === "finished" && match.went_to_penalties && (
              <p className="text-slate-600">
                Pens: {formatScoreLine(match.home_score_pen, match.away_score_pen)}
              </p>
            )}
            {hasScoredPrediction(prediction) && (
              <p className="font-semibold text-emerald-600">
                +{totalPredictionPoints(prediction)} pts
              </p>
            )}
          </div>
          {!locked && !predictionsDisabled && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit
            </button>
          )}
          {locked && !predictionsDisabled && (
            <p className="text-xs text-slate-500">Locked after kickoff</p>
          )}
        </div>
      )}
    </article>
  );
}
