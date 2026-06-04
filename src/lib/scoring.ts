export const SCORING = {
  exact: 5,
  resultAndDiff: 3,
  resultOnly: 1,
} as const;

export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) {
    return SCORING.exact;
  }

  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;

  const predResult = Math.sign(predDiff);
  const actualResult = Math.sign(actualDiff);

  if (predResult !== actualResult) {
    return 0;
  }

  if (predDiff === actualDiff) {
    return SCORING.resultAndDiff;
  }

  return SCORING.resultOnly;
}

type ScorePhase = {
  predHome: number | null;
  predAway: number | null;
  actualHome: number | null;
  actualAway: number | null;
  applies: boolean;
};

function scorePhase({ predHome, predAway, actualHome, actualAway, applies }: ScorePhase) {
  if (
    !applies ||
    predHome == null ||
    predAway == null ||
    actualHome == null ||
    actualAway == null
  ) {
    return null;
  }

  return calculatePoints(predHome, predAway, actualHome, actualAway);
}

export function scorePredictionPhases(
  prediction: {
    pred_home: number;
    pred_away: number;
    pred_et_home: number | null;
    pred_et_away: number | null;
    pred_pen_home: number | null;
    pred_pen_away: number | null;
  },
  match: {
    home_score: number | null;
    away_score: number | null;
    home_score_90: number | null;
    away_score_90: number | null;
    home_score_et: number | null;
    away_score_et: number | null;
    home_score_pen: number | null;
    away_score_pen: number | null;
    went_to_extra_time: boolean;
    went_to_penalties: boolean;
    status: string;
  }
) {
  if (match.status !== "finished") {
    return {
      points_awarded: null as number | null,
      et_points_awarded: null as number | null,
      pen_points_awarded: null as number | null,
    };
  }

  const home90 = match.home_score_90 ?? match.home_score;
  const away90 = match.away_score_90 ?? match.away_score;

  return {
    points_awarded:
      home90 != null && away90 != null
        ? calculatePoints(prediction.pred_home, prediction.pred_away, home90, away90)
        : null,
    et_points_awarded: scorePhase({
      predHome: prediction.pred_et_home,
      predAway: prediction.pred_et_away,
      actualHome: match.home_score_et,
      actualAway: match.away_score_et,
      applies: match.went_to_extra_time,
    }),
    pen_points_awarded: scorePhase({
      predHome: prediction.pred_pen_home,
      predAway: prediction.pred_pen_away,
      actualHome: match.home_score_pen,
      actualAway: match.away_score_pen,
      applies: match.went_to_penalties,
    }),
  };
}
