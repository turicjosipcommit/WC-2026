const WC_COMPETITION_ID = 734;
const WC_PROJECT_ID = 2;

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** LiveScore `Esd` timestamps are UTC+2 (CEST); subtract to get UTC kickoff. */
function parseOffsetHours(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const LIVESCORE = {
  baseUrl: "https://prod-cdn-public-api.livescore.com/v1/api/app",
  competitionId: parseIntEnv("LIVESCORE_COMPETITION_ID", WC_COMPETITION_ID),
  projectId: parseIntEnv("LIVESCORE_PROJECT_ID", WC_PROJECT_ID),
  /** API path segment: `details` (full WC feed) or `details-w` (friendlies feed). */
  detailsVariant: process.env.LIVESCORE_DETAILS_VARIANT?.trim() || "details",
  locale: process.env.LIVESCORE_LOCALE?.trim() || "en",
  /** Hours to subtract from parsed `Esd` to convert to UTC. */
  esdUtcOffsetHours: parseOffsetHours("LIVESCORE_ESD_UTC_OFFSET_HOURS", 2),
};
