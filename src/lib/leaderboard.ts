import { countCorrectResultPhases, countExactScorePhases, SCORING } from "@/lib/scoring";
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
    resultAndOneTeam: 0,
    resultOnly: 0,
    oneTeamOnly: 0,
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

  if (pointsAwarded === SCORING.resultAndOneTeam) {
    breakdown.resultAndOneTeam += 1;
    return;
  }

  if (pointsAwarded === SCORING.resultOnly) {
    breakdown.resultOnly += 1;
    return;
  }

  if (pointsAwarded === SCORING.oneTeamOnly) {
    breakdown.oneTeamOnly += 1;
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
      correct_results: 0,
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
      row.total_points += scoredPhases.reduce((sum, points) => sum + (points ?? 0), 0);
      applyPointsBreakdown(row.points_breakdown, prediction.points_awarded);
    }

    row.exact_scores += countExactScorePhases(prediction);
    row.correct_results += countCorrectResultPhases(prediction);
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.total_points - a.total_points ||
      b.exact_scores - a.exact_scores ||
      b.correct_results - a.correct_results
  );
}

export const POINTS_BREAKDOWN_LABELS = [
  { key: "exact" as const, label: "Exact score", points: SCORING.exact },
  {
    key: "resultAndOneTeam" as const,
    label: "Result + one team score",
    points: SCORING.resultAndOneTeam,
  },
  { key: "resultOnly" as const, label: "Result only", points: SCORING.resultOnly },
  { key: "oneTeamOnly" as const, label: "One team score", points: SCORING.oneTeamOnly },
  { key: "none" as const, label: "No points", points: SCORING.none },
  { key: "pending" as const, label: "Pending", points: null },
];
