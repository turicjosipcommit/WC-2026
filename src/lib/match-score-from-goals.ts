export type GoalScoreSnapshot = {
  minute: number;
  home_score_after: number;
  away_score_after: number;
  sort_order: number;
};

/** Last scoreline from goals scored in regular time (minute ≤ 90). */
export function deriveScoreAt90FromGoals(
  goals: GoalScoreSnapshot[]
): { home: number; away: number } | null {
  const regularTimeGoals = goals.filter((goal) => goal.minute <= 90);

  if (regularTimeGoals.length === 0) {
    return goals.length === 0 ? { home: 0, away: 0 } : null;
  }

  const last = [...regularTimeGoals].sort((a, b) => a.sort_order - b.sort_order).at(-1)!;
  return { home: last.home_score_after, away: last.away_score_after };
}

export function hasExtraTimeGoals(goals: Pick<GoalScoreSnapshot, "minute">[]) {
  return goals.some((goal) => goal.minute > 90);
}

/** True when stored 90′ likely equals final/ET because LiveScore omitted Trh1/Trh2. */
export function shouldReconcileScoreAt90(
  match: {
    went_to_extra_time: boolean;
    home_score_90: number | null;
    away_score_90: number | null;
    home_score_et: number | null;
    away_score_et: number | null;
  },
  goals: Pick<GoalScoreSnapshot, "minute">[]
) {
  if (!match.went_to_extra_time || !hasExtraTimeGoals(goals)) {
    return false;
  }

  if (match.home_score_90 == null || match.away_score_90 == null) {
    return true;
  }

  const matchesEtOrFinal =
    match.home_score_90 === match.home_score_et &&
    match.away_score_90 === match.away_score_et &&
    match.home_score_et != null &&
    match.away_score_et != null;

  return matchesEtOrFinal;
}
