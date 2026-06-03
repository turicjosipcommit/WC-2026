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
