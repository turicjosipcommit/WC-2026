import type { OtherPick } from "@/lib/fixtures-grouping";
import {
  scoreProvisionalPredictionPhases,
  sumPhasePoints,
  type MatchScoringSnapshot,
} from "@/lib/scoring";
import type { Match, Prediction } from "@/lib/types";

type PickPointsSource = Pick<
  OtherPick,
  | "predHome"
  | "predAway"
  | "predEtHome"
  | "predEtAway"
  | "predPenHome"
  | "predPenAway"
  | "pointsAwarded"
  | "etPointsAwarded"
  | "penPointsAwarded"
>;

function pickToScoringInput(pick: PickPointsSource) {
  return {
    pred_home: pick.predHome,
    pred_away: pick.predAway,
    pred_et_home: pick.predEtHome,
    pred_et_away: pick.predEtAway,
    pred_pen_home: pick.predPenHome,
    pred_pen_away: pick.predPenAway,
  };
}

function matchToScoringSnapshot(match: Match): MatchScoringSnapshot {
  return {
    home_score: match.home_score,
    away_score: match.away_score,
    home_score_90: match.home_score_90,
    away_score_90: match.away_score_90,
    home_score_et: match.home_score_et,
    away_score_et: match.away_score_et,
    home_score_pen: match.home_score_pen,
    away_score_pen: match.away_score_pen,
    went_to_extra_time: match.went_to_extra_time,
    went_to_penalties: match.went_to_penalties,
    status: match.status,
  };
}

function storedPickPoints(pick: PickPointsSource) {
  return (
    (pick.pointsAwarded ?? 0) +
    (pick.etPointsAwarded ?? 0) +
    (pick.penPointsAwarded ?? 0)
  );
}

export function computePickPoints(pick: PickPointsSource, match: Match) {
  if (match.status === "finished") {
    return storedPickPoints(pick);
  }

  if (match.status === "live") {
    return sumPhasePoints(
      scoreProvisionalPredictionPhases(pickToScoringInput(pick), matchToScoringSnapshot(match))
    );
  }

  return 0;
}

export function isKnockoutMatch(match: Pick<Match, "stage">) {
  return match.stage !== "Group stage";
}

export function isPredictionLocked(
  match: Pick<Match, "kickoff_at" | "status">,
  predictionsDisabled = false
) {
  return (
    predictionsDisabled ||
    new Date(match.kickoff_at) <= new Date() ||
    !["scheduled", "postponed"].includes(match.status)
  );
}

/** Hide other players' picks until kickoff so they can't be copied beforehand. */
export function canRevealOtherPicks(
  match: Pick<Match, "kickoff_at" | "status">
) {
  if (match.status === "live" || match.status === "finished") {
    return true;
  }

  return new Date(match.kickoff_at) <= new Date();
}

export function totalPredictionPoints(prediction: Pick<
  Prediction,
  "points_awarded" | "et_points_awarded" | "pen_points_awarded"
>) {
  return (
    (prediction.points_awarded ?? 0) +
    (prediction.et_points_awarded ?? 0) +
    (prediction.pen_points_awarded ?? 0)
  );
}

export function hasScoredPrediction(prediction: Pick<
  Prediction,
  "points_awarded" | "et_points_awarded" | "pen_points_awarded"
>) {
  return (
    prediction.points_awarded != null ||
    prediction.et_points_awarded != null ||
    prediction.pen_points_awarded != null
  );
}

export function formatScoreLine(home: number | null | undefined, away: number | null | undefined) {
  if (home == null || away == null) return null;
  return `${home} - ${away}`;
}

export function formatPredictionSummary(prediction: Pick<
  Prediction,
  | "pred_home"
  | "pred_away"
  | "pred_et_home"
  | "pred_et_away"
  | "pred_pen_home"
  | "pred_pen_away"
>) {
  const parts = [`90′ ${prediction.pred_home}-${prediction.pred_away}`];
  const et = formatScoreLine(prediction.pred_et_home, prediction.pred_et_away);
  const pen = formatScoreLine(prediction.pred_pen_home, prediction.pred_pen_away);

  if (et) parts.push(`prod. ${et.replace(" - ", "-")}`);
  if (pen) parts.push(`pen. ${pen.replace(" - ", "-")}`);

  return parts.join(" · ");
}
