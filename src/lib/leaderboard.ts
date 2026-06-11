import {
  countCorrectResultPhases,
  countExactScorePhases,
  scoreProvisionalPredictionPhases,
  SCORING,
  sumPhasePoints,
  type MatchScoringSnapshot,
  type PredictionPhasePoints,
} from "@/lib/scoring";
import type { LeaderboardRow, PointsBreakdown } from "@/lib/types";

export type LeaderboardMode = "official" | "live";

type ProfileRow = {
  id: string;
  display_name: string;
};

export type LeaderboardPredictionInput = {
  user_id: string;
  pred_home: number;
  pred_away: number;
  pred_et_home: number | null;
  pred_et_away: number | null;
  pred_pen_home: number | null;
  pred_pen_away: number | null;
  points_awarded: number | null;
  et_points_awarded: number | null;
  pen_points_awarded: number | null;
  match: MatchScoringSnapshot | null;
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

function storedPhasePoints(prediction: LeaderboardPredictionInput): PredictionPhasePoints {
  return {
    points_awarded: prediction.points_awarded,
    et_points_awarded: prediction.et_points_awarded,
    pen_points_awarded: prediction.pen_points_awarded,
  };
}

function effectivePhasePoints(
  prediction: LeaderboardPredictionInput,
  mode: LeaderboardMode
): PredictionPhasePoints {
  if (mode === "official") {
    return storedPhasePoints(prediction);
  }

  const match = prediction.match;
  if (!match) {
    return storedPhasePoints(prediction);
  }

  if (match.status === "finished") {
    return storedPhasePoints(prediction);
  }

  if (match.status === "live") {
    return scoreProvisionalPredictionPhases(
      {
        pred_home: prediction.pred_home,
        pred_away: prediction.pred_away,
        pred_et_home: prediction.pred_et_home,
        pred_et_away: prediction.pred_et_away,
        pred_pen_home: prediction.pred_pen_home,
        pred_pen_away: prediction.pred_pen_away,
      },
      match
    );
  }

  return {
    points_awarded: null,
    et_points_awarded: null,
    pen_points_awarded: null,
  };
}

function createEmptyRow(profile: ProfileRow): LeaderboardRow {
  return {
    user_id: profile.id,
    display_name: profile.display_name,
    total_points: 0,
    official_total_points: 0,
    live_provisional_points: 0,
    predictions_count: 0,
    exact_scores: 0,
    correct_results: 0,
    points_breakdown: emptyPointsBreakdown(),
  };
}

export function buildLeaderboardRows(
  profiles: ProfileRow[],
  predictions: LeaderboardPredictionInput[],
  mode: LeaderboardMode = "official"
): LeaderboardRow[] {
  const rows = new Map<string, LeaderboardRow>();

  for (const profile of profiles) {
    rows.set(profile.id, createEmptyRow(profile));
  }

  for (const prediction of predictions) {
    const row = rows.get(prediction.user_id);
    if (!row) continue;

    row.predictions_count += 1;

    const officialPhases = storedPhasePoints(prediction);
    const officialScoredPhases = [
      officialPhases.points_awarded,
      officialPhases.et_points_awarded,
      officialPhases.pen_points_awarded,
    ].filter((points) => points !== null);

    if (officialScoredPhases.length > 0) {
      row.official_total_points += sumPhasePoints(officialPhases);
    }

    const effectivePhases = effectivePhasePoints(prediction, mode);
    const effectiveScoredPhases = [
      effectivePhases.points_awarded,
      effectivePhases.et_points_awarded,
      effectivePhases.pen_points_awarded,
    ].filter((points) => points !== null);

    if (effectiveScoredPhases.length === 0) {
      row.points_breakdown.pending += 1;
    } else {
      row.total_points += sumPhasePoints(effectivePhases);
      applyPointsBreakdown(row.points_breakdown, effectivePhases.points_awarded);
    }

    if (mode === "live" && prediction.match?.status === "live") {
      row.live_provisional_points += sumPhasePoints(effectivePhases);
    }

    row.exact_scores += countExactScorePhases(effectivePhases);
    row.correct_results += countCorrectResultPhases(effectivePhases);
  }

  if (mode === "official") {
    for (const row of rows.values()) {
      row.total_points = row.official_total_points;
      row.live_provisional_points = 0;
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.total_points - a.total_points ||
      b.exact_scores - a.exact_scores ||
      b.correct_results - a.correct_results
  );
}

export const POINTS_BREAKDOWN_LABELS = [
  { key: "exact" as const, label: "Točan rezultat", points: SCORING.exact },
  {
    key: "resultAndOneTeam" as const,
    label: "Ishod + jedan rezultat momčadi",
    points: SCORING.resultAndOneTeam,
  },
  { key: "resultOnly" as const, label: "Samo ishod", points: SCORING.resultOnly },
  { key: "oneTeamOnly" as const, label: "Jedan rezultat momčadi", points: SCORING.oneTeamOnly },
  { key: "none" as const, label: "Bez bodova", points: SCORING.none },
  { key: "pending" as const, label: "Na čekanju", points: null },
];
