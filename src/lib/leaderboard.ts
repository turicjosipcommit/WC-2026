import { SCORING } from "@/lib/scoring";
import type { LeaderboardRow, PointsBreakdown } from "@/lib/types";

type ProfileRow = {
  id: string;
  display_name: string;
};

type PredictionRow = {
  user_id: string;
  points_awarded: number | null;
  et_points_awarded: number | null;
  pen_points_awarded: number | null;
};

export function emptyPointsBreakdown(): PointsBreakdown {
  return {
    exact: 0,
    resultAndDiff: 0,
    resultOnly: 0,
    none: 0,
    pending: 0,
  };
}

function applyPointsBreakdown(breakdown: PointsBreakdown, pointsAwarded: number | null) {
  if (pointsAwarded === null) {
    return;
  }

  if (pointsAwarded === SCORING.exact) {
    breakdown.exact += 1;
    return;
  }

  if (pointsAwarded === SCORING.resultAndDiff) {
    breakdown.resultAndDiff += 1;
    return;
  }

  if (pointsAwarded === SCORING.resultOnly) {
    breakdown.resultOnly += 1;
    return;
  }

  breakdown.none += 1;
}

function predictionPhasePoints(prediction: PredictionRow) {
  return [
    prediction.points_awarded,
    prediction.et_points_awarded,
    prediction.pen_points_awarded,
  ];
}

export function buildLeaderboardRows(
  profiles: ProfileRow[],
  predictions: PredictionRow[]
): LeaderboardRow[] {
  const rows = new Map<string, LeaderboardRow>();

  for (const profile of profiles) {
    rows.set(profile.id, {
      user_id: profile.id,
      display_name: profile.display_name,
      total_points: 0,
      predictions_count: 0,
      exact_scores: 0,
      points_breakdown: emptyPointsBreakdown(),
    });
  }

  for (const prediction of predictions) {
    const row = rows.get(prediction.user_id);
    if (!row) continue;

    row.predictions_count += 1;

    const phases = predictionPhasePoints(prediction);
    const scoredPhases = phases.filter((points) => points !== null);

    if (scoredPhases.length === 0) {
      row.points_breakdown.pending += 1;
    } else {
      for (const points of scoredPhases) {
        row.total_points += points ?? 0;
        applyPointsBreakdown(row.points_breakdown, points);
      }
    }

    if (prediction.points_awarded === SCORING.exact) {
      row.exact_scores += 1;
    }
  }

  return [...rows.values()].sort(
    (a, b) => b.total_points - a.total_points || b.exact_scores - a.exact_scores
  );
}

export const POINTS_BREAKDOWN_LABELS = [
  { key: "exact" as const, label: "Exact score", points: SCORING.exact },
  { key: "resultAndDiff" as const, label: "Result + goal diff", points: SCORING.resultAndDiff },
  { key: "resultOnly" as const, label: "Result only", points: SCORING.resultOnly },
  { key: "none" as const, label: "No points", points: 0 },
  { key: "pending" as const, label: "Pending", points: null },
];
