import type { MatchStatus } from "@/lib/types";
import type { LiveScoreEvent, LiveScoreStage, LiveScoreNormalizedEvent } from "./types";

function teamName(event: LiveScoreEvent, side: "T1" | "T2") {
  return event[side]?.[0]?.Nm?.trim() ?? "TBD";
}

function parseOptionalInt(value: string | undefined) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function liveScoreEventIdToDbId(eventId: string): number {
  const parsed = Number.parseInt(eventId, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid LiveScore event id: ${eventId}`);
  }
  return parsed;
}

/** LiveScore often sends the clock as `65'`, `45+2'`, etc. while the match is in play. */
export function isLiveScoreClockStatus(eps: string) {
  return /^\d{1,3}(\+\d{1,2})?'?$/i.test(eps.trim());
}

export function isLiveScoreInPlayStatus(eps: string, esid?: number) {
  const code = eps.toUpperCase();
  if (["1H", "2H", "HT", "ET", "PT", "LIVE"].includes(code)) {
    return true;
  }
  if (isLiveScoreClockStatus(code)) {
    return true;
  }
  // Esid 2/3 = in play in LiveScore feeds (minute markers use 3).
  return esid === 2 || esid === 3;
}

export function mapLiveScoreStatus(eps: string, esid?: number): MatchStatus {
  const code = eps.toUpperCase();

  if (code === "NS") return "scheduled";
  if (code === "FT" || code === "AET" || code === "AP") return "finished";
  if (code === "POST" || code === "PST") return "postponed";
  if (code === "CANC" || code === "ABD" || code === "AWD") return "cancelled";
  if (isLiveScoreInPlayStatus(code, esid)) return "live";
  if (esid === 6 || esid === 13) return "finished";

  return "scheduled";
}

export function extractGroupName(stage: LiveScoreStage): string | null {
  const match = stage.Snm.match(/^Group ([A-L])$/i);
  return match ? `Group ${match[1].toUpperCase()}` : null;
}

export function extractStage(stage: LiveScoreStage): string {
  if (extractGroupName(stage)) {
    return "Group stage";
  }

  if (stage.Snm) {
    return stage.Snm;
  }

  return "Knockout";
}

export function normalizeEvent(
  event: LiveScoreEvent,
  stage: LiveScoreStage
): LiveScoreNormalizedEvent {
  const homeScore = parseOptionalInt(event.Tr1);
  const awayScore = parseOptionalInt(event.Tr2);
  const homeScoreEt = parseOptionalInt(event.Tr1ET);
  const awayScoreEt = parseOptionalInt(event.Tr2ET);
  const homeScorePen = parseOptionalInt(event.Trp1);
  const awayScorePen = parseOptionalInt(event.Trp2);
  const homeScore90 = parseOptionalInt(event.Trh1) ?? homeScore;
  const awayScore90 = parseOptionalInt(event.Trh2) ?? awayScore;

  return {
    id: liveScoreEventIdToDbId(event.Eid),
    homeTeam: teamName(event, "T1"),
    awayTeam: teamName(event, "T2"),
    groupName: extractGroupName(stage),
    stage: extractStage(stage),
    roundNumber: event.ErnInf ? Number.parseInt(event.ErnInf, 10) || null : null,
    startTimestamp: 0,
    statusCode: event.Eps,
    statusId: event.Esid,
    homeScore,
    awayScore,
    homeScore90,
    awayScore90,
    homeScoreEt,
    awayScoreEt,
    homeScorePen,
    awayScorePen,
  };
}
