import type { Match, Prediction } from "@/lib/types";

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
  const parts = [`FT ${prediction.pred_home}-${prediction.pred_away}`];
  const et = formatScoreLine(prediction.pred_et_home, prediction.pred_et_away);
  const pen = formatScoreLine(prediction.pred_pen_home, prediction.pred_pen_away);

  if (et) parts.push(`ET ${et.replace(" - ", "-")}`);
  if (pen) parts.push(`Pens ${pen.replace(" - ", "-")}`);

  return parts.join(" · ");
}
