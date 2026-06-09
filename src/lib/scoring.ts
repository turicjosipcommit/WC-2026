export const SCORING = {
  exact: 4,
  resultAndOneTeam: 3,
  resultOnly: 2,
  oneTeamOnly: 1,
  none: 0,
} as const;

export const KNOCKOUT_ET_POINTS = {
  outcomeOnly: 1,
  sameScoreAs90: 2,
  exactDifferentDrawOrWin: 3,
} as const;

export const KNOCKOUT_PEN_POINTS = {
  outcome: 1,
  exact: 2,
} as const;

type MatchOutcome = "home" | "away" | "draw";

function matchOutcome(home: number, away: number): MatchOutcome {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) {
    return SCORING.exact;
  }

  const correctOutcome =
    matchOutcome(predHome, predAway) === matchOutcome(actualHome, actualAway);
  const homeExact = predHome === actualHome;
  const awayExact = predAway === actualAway;
  const oneTeamExact = homeExact || awayExact;

  if (correctOutcome && oneTeamExact) {
    return SCORING.resultAndOneTeam;
  }

  if (correctOutcome) {
    return SCORING.resultOnly;
  }

  if (oneTeamExact) {
    return SCORING.oneTeamOnly;
  }

  return SCORING.none;
}

export function awardedCorrectResult(pointsAwarded: number | null) {
  return pointsAwarded != null && pointsAwarded >= SCORING.resultOnly;
}

export function awardedCorrectEt(etPointsAwarded: number | null) {
  return (
    etPointsAwarded != null && etPointsAwarded >= KNOCKOUT_ET_POINTS.outcomeOnly
  );
}

export function awardedCorrectPen(penPointsAwarded: number | null) {
  return (
    penPointsAwarded != null && penPointsAwarded >= KNOCKOUT_PEN_POINTS.outcome
  );
}

export function countCorrectResultPhases(prediction: {
  points_awarded: number | null;
  et_points_awarded: number | null;
  pen_points_awarded: number | null;
}) {
  let count = 0;

  if (awardedCorrectResult(prediction.points_awarded)) {
    count += 1;
  }

  if (awardedCorrectEt(prediction.et_points_awarded)) {
    count += 1;
  }

  if (awardedCorrectPen(prediction.pen_points_awarded)) {
    count += 1;
  }

  return count;
}

export function awardedExact90(pointsAwarded: number | null) {
  return pointsAwarded === SCORING.exact;
}

export function awardedExactEt(
  etPointsAwarded: number | null,
  penPointsAwarded: number | null
) {
  if (etPointsAwarded === KNOCKOUT_ET_POINTS.sameScoreAs90) {
    return true;
  }

  // 3 ET pts without pens means correct ET winner only, not an exact ET scoreline.
  if (
    etPointsAwarded === KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin &&
    penPointsAwarded !== null
  ) {
    return true;
  }

  return false;
}

export function awardedExactPen(penPointsAwarded: number | null) {
  return penPointsAwarded === KNOCKOUT_PEN_POINTS.exact;
}

export function countExactScorePhases(prediction: {
  points_awarded: number | null;
  et_points_awarded: number | null;
  pen_points_awarded: number | null;
}) {
  let count = 0;

  if (awardedExact90(prediction.points_awarded)) {
    count += 1;
  }

  if (awardedExactEt(prediction.et_points_awarded, prediction.pen_points_awarded)) {
    count += 1;
  }

  if (awardedExactPen(prediction.pen_points_awarded)) {
    count += 1;
  }

  return count;
}

function isExact90Prediction(
  prediction: { pred_home: number; pred_away: number },
  home90: number,
  away90: number
) {
  return prediction.pred_home === home90 && prediction.pred_away === away90;
}

function scoreExtraTimePoints(
  prediction: {
    pred_et_home: number | null;
    pred_et_away: number | null;
  },
  match: {
    home_score_90: number | null;
    away_score_90: number | null;
    home_score: number | null;
    away_score: number | null;
    home_score_et: number | null;
    away_score_et: number | null;
    went_to_penalties: boolean;
  },
  exact90: boolean
): number | null {
  if (!exact90) {
    return 0;
  }

  if (
    prediction.pred_et_home == null ||
    prediction.pred_et_away == null ||
    match.home_score_et == null ||
    match.away_score_et == null
  ) {
    return 0;
  }

  const home90 = match.home_score_90 ?? match.home_score;
  const away90 = match.away_score_90 ?? match.away_score;
  if (home90 == null || away90 == null) {
    return 0;
  }

  const predEtHome = prediction.pred_et_home;
  const predEtAway = prediction.pred_et_away;
  const actualEtHome = match.home_score_et;
  const actualEtAway = match.away_score_et;

  const predEtOutcome = matchOutcome(predEtHome, predEtAway);
  const actualEtOutcome = matchOutcome(actualEtHome, actualEtAway);
  const exactEtScore = predEtHome === actualEtHome && predEtAway === actualEtAway;
  const actualEtSameAs90 = actualEtHome === home90 && actualEtAway === away90;
  const actualEtDifferentDraw =
    actualEtOutcome === "draw" && !actualEtSameAs90;

  if (!match.went_to_penalties && actualEtOutcome !== "draw") {
    if (predEtOutcome !== "draw" && predEtOutcome === actualEtOutcome) {
      return KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin;
    }
    return 0;
  }

  if (match.went_to_penalties) {
    if (actualEtDifferentDraw) {
      return exactEtScore ? KNOCKOUT_ET_POINTS.exactDifferentDrawOrWin : 0;
    }

    if (actualEtSameAs90) {
      if (exactEtScore) {
        return KNOCKOUT_ET_POINTS.sameScoreAs90;
      }
      if (predEtOutcome === "draw") {
        return KNOCKOUT_ET_POINTS.outcomeOnly;
      }
      return 0;
    }

    if (actualEtOutcome === "draw" && predEtOutcome === "draw") {
      return KNOCKOUT_ET_POINTS.outcomeOnly;
    }
  }

  return 0;
}

function scorePenaltyPoints(
  prediction: {
    pred_pen_home: number | null;
    pred_pen_away: number | null;
  },
  match: {
    home_score_pen: number | null;
    away_score_pen: number | null;
    went_to_penalties: boolean;
  },
  exact90: boolean
): number | null {
  if (!match.went_to_penalties) {
    return null;
  }

  if (!exact90) {
    return 0;
  }

  if (
    prediction.pred_pen_home == null ||
    prediction.pred_pen_away == null ||
    match.home_score_pen == null ||
    match.away_score_pen == null
  ) {
    return 0;
  }

  if (
    prediction.pred_pen_home === match.home_score_pen &&
    prediction.pred_pen_away === match.away_score_pen
  ) {
    return KNOCKOUT_PEN_POINTS.exact;
  }

  if (
    matchOutcome(prediction.pred_pen_home, prediction.pred_pen_away) ===
    matchOutcome(match.home_score_pen, match.away_score_pen)
  ) {
    return KNOCKOUT_PEN_POINTS.outcome;
  }

  return 0;
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
  const exact90 =
    home90 != null && away90 != null && isExact90Prediction(prediction, home90, away90);

  return {
    points_awarded:
      home90 != null && away90 != null
        ? calculatePoints(prediction.pred_home, prediction.pred_away, home90, away90)
        : null,
    et_points_awarded: match.went_to_extra_time
      ? scoreExtraTimePoints(prediction, match, exact90)
      : null,
    pen_points_awarded: scorePenaltyPoints(prediction, match, exact90),
  };
}
