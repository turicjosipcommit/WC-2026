import type { MatchGoal } from "@/lib/types";
import type {
  LiveScoreGoalType,
  LiveScoreIncident,
  LiveScoreIncidentsResponse,
} from "./types";

/** LiveScore incident type codes observed in football feeds. */
const GOAL_INCIDENT_TYPES = new Set([36, 37, 39]);
const ASSIST_INCIDENT_TYPE = 63;

function mapGoalType(incidentType: number): LiveScoreGoalType {
  if (incidentType === 39) return "own_goal";
  if (incidentType === 37) return "penalty";
  return "goal";
}

function teamFromSide(side: number): "home" | "away" {
  return side === 1 ? "home" : "away";
}

function collectGoalIncidents(incidents: LiveScoreIncident[]): LiveScoreIncident[] {
  const goals: LiveScoreIncident[] = [];

  for (const incident of incidents) {
    if (incident.Incs?.length) {
      goals.push(...collectGoalIncidents(incident.Incs));
      continue;
    }

    if (incident.IT === ASSIST_INCIDENT_TYPE) continue;
    if (!incident.Sc || incident.Sc.length < 2) continue;
    if (incident.IT != null && !GOAL_INCIDENT_TYPES.has(incident.IT)) continue;

    goals.push(incident);
  }

  return goals;
}

export function parseGoalsFromIncidents(
  response: LiveScoreIncidentsResponse
): Omit<MatchGoal, "id" | "match_id" | "created_at">[] {
  const goals: Omit<MatchGoal, "id" | "match_id" | "created_at">[] = [];
  let sortOrder = 0;

  for (const [periodKey, periodIncidents] of Object.entries(response.Incs ?? {})) {
    const period = Number.parseInt(periodKey, 10);
    if (Number.isNaN(period)) continue;

    for (const incident of collectGoalIncidents(periodIncidents)) {
      if (incident.Min == null || !incident.Pn || !incident.Sc) continue;

      goals.push({
        minute: incident.Min,
        stoppage_minute: incident.MinEx ?? null,
        period,
        team: teamFromSide(incident.Nm),
        player_name: incident.Pn,
        goal_type: mapGoalType(incident.IT ?? 36),
        home_score_after: incident.Sc[0],
        away_score_after: incident.Sc[1],
        sort_order: sortOrder,
      });
      sortOrder += 1;
    }
  }

  return goals;
}
