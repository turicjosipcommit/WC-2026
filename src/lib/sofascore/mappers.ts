import type { SofaScoreStatusType } from "./types";
import type { MatchStatus } from "@/lib/types";

export function mapSofaScoreStatus(type: SofaScoreStatusType): MatchStatus {
  switch (type) {
    case "notstarted":
      return "scheduled";
    case "inprogress":
      return "live";
    case "finished":
      return "finished";
    case "postponed":
      return "postponed";
    case "canceled":
      return "cancelled";
    default:
      return "scheduled";
  }
}

export function extractStage(event: {
  roundInfo?: { round?: number; name?: string };
  tournament?: { name?: string; groupName?: string };
}): string {
  if (event.roundInfo?.name) {
    return event.roundInfo.name;
  }

  const tournamentName = event.tournament?.name ?? "";
  if (tournamentName.includes("Group")) {
    return "Group stage";
  }

  return "Knockout";
}

export function extractGroupName(event: {
  tournament?: { name?: string; groupName?: string };
}): string | null {
  if (event.tournament?.groupName) {
    return event.tournament.groupName;
  }

  const name = event.tournament?.name ?? "";
  const match = name.match(/Group ([A-L])/i);
  return match ? `Group ${match[1].toUpperCase()}` : null;
}
