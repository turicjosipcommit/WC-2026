import { createAdminClient } from "@/lib/supabase/admin";
import type { Match, MatchStatus } from "@/lib/types";

/** Minutes before kickoff to start polling. */
const PRE_KICKOFF_MINUTES = 5;
/** Minutes after kickoff for scheduled/postponed matches still in play. */
const MATCH_WINDOW_MINUTES = 180;
/** UTC minutes when the slow fallback sync always runs. */
const FALLBACK_MINUTES = new Set([0, 30]);

const ACTIVE_STATUSES: MatchStatus[] = ["scheduled", "postponed", "live"];

export type SyncWindowMatch = Pick<
  Match,
  "id" | "kickoff_at" | "status" | "home_team" | "away_team"
>;

export function isMatchInSyncWindow(
  match: Pick<Match, "kickoff_at" | "status">,
  now = new Date()
): boolean {
  if (match.status === "live") {
    return true;
  }

  if (!ACTIVE_STATUSES.includes(match.status)) {
    return false;
  }

  const kickoffMs = new Date(match.kickoff_at).getTime();
  const nowMs = now.getTime();
  const windowStartMs = kickoffMs - PRE_KICKOFF_MINUTES * 60 * 1000;
  const windowEndMs = kickoffMs + MATCH_WINDOW_MINUTES * 60 * 1000;

  return nowMs >= windowStartMs && nowMs <= windowEndMs;
}

export function isFallbackSyncMinute(now = new Date()) {
  return FALLBACK_MINUTES.has(now.getUTCMinutes());
}

export type ResultsSyncDecision = {
  run: boolean;
  reason: "forced" | "fallback" | "active_window" | "idle";
  activeMatches: SyncWindowMatch[];
};

export async function evaluateResultsSync(options?: {
  force?: boolean;
  now?: Date;
}): Promise<ResultsSyncDecision> {
  const now = options?.now ?? new Date();

  if (options?.force) {
    return { run: true, reason: "forced", activeMatches: [] };
  }

  if (isFallbackSyncMinute(now)) {
    return { run: true, reason: "fallback", activeMatches: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, kickoff_at, status, home_team, away_team")
    .in("status", ACTIVE_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  const activeMatches = ((data ?? []) as SyncWindowMatch[]).filter((match) =>
    isMatchInSyncWindow(match, now)
  );

  if (activeMatches.length > 0) {
    return { run: true, reason: "active_window", activeMatches };
  }

  return { run: false, reason: "idle", activeMatches: [] };
}
