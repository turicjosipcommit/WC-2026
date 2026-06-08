export const LIVESCORE_TEAM_BADGE_CDN = "https://lsm-static-prod.livescore.com/medium";

export function teamBadgeUrl(imgPath: string | null | undefined) {
  if (!imgPath?.trim()) {
    return null;
  }

  return `${LIVESCORE_TEAM_BADGE_CDN}/${imgPath.replace(/^\//, "")}`;
}
