"use client";

import type { OtherPick } from "@/lib/fixtures-grouping";
import { PredictionEditor } from "@/components/prediction-editor";
import {
  formatPredictionSummary,
  formatScoreLine,
  hasScoredPrediction,
  isPredictionLocked,
  totalPredictionPoints,
} from "@/lib/match-phase";
import {
  formatGoalLabel,
  groupGoalsByTeam,
} from "@/lib/match-goals";
import type { Match, MatchGoal, Prediction } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction | null;
  otherPicks?: OtherPick[];
  goals?: MatchGoal[];
  predictionsDisabled?: boolean;
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

function GoalList({ goals }: { goals: MatchGoal[] }) {
  if (goals.length === 0) return null;

  return (
    <ul className="space-y-0.5 text-xs text-slate-600">
      {goals.map((goal) => (
        <li key={goal.id}>{formatGoalLabel(goal)}</li>
      ))}
    </ul>
  );
}

export function MatchCard({
  match,
  prediction,
  otherPicks = [],
  goals = [],
  predictionsDisabled = false,
}: MatchCardProps) {
  const locked = isPredictionLocked(match, predictionsDisabled);

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
  const { home: homeGoals, away: awayGoals } = groupGoalsByTeam(goals);
  const showGoals =
    goals.length > 0 && (match.status === "live" || match.status === "finished");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {match.group_name ? `${match.group_name} · ` : ""}
          {match.stage}
          {match.round_number ? ` · MD ${match.round_number}` : ""}
        </span>
        <span
          className={
            match.status === "live"
              ? "rounded-full bg-red-100 px-2 py-1 font-semibold uppercase tracking-wide text-red-700"
              : match.status === "finished"
                ? "rounded-full bg-emerald-100 px-2 py-1 font-semibold uppercase tracking-wide text-emerald-800"
                : "rounded-full bg-slate-100 px-2 py-1 uppercase tracking-wide text-slate-600"
          }
        >
          {match.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{match.home_team}</p>
          {match.status === "finished" && ftScore && (
            <p className="text-3xl font-bold text-emerald-600">{ftScore.split(" - ")[0]}</p>
          )}
          {showGoals && <div className="mt-2"><GoalList goals={homeGoals} /></div>}
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
          {showGoals && (
            <div className="mt-2 sm:text-right">
              <GoalList goals={awayGoals} />
            </div>
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
          <PredictionEditor match={match} prediction={prediction} />
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
