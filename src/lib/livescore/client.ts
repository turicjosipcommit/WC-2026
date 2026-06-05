import { LIVESCORE } from "./constants";
import { normalizeEvent } from "./mappers";
import type {
  LiveScoreCompetitionDetails,
  LiveScoreIncidentsResponse,
  LiveScoreNormalizedEvent,
} from "./types";

function competitionDetailsUrl() {
  const { baseUrl, competitionId, projectId, locale, detailsVariant } = LIVESCORE;
  return `${baseUrl}/competition/${competitionId}/${detailsVariant}/${projectId}?locale=${locale}`;
}

export function parseLiveScoreKickoff(esd: number): Date {
  const raw = String(esd);
  if (raw.length !== 14) {
    throw new Error(`Invalid LiveScore Esd value: ${esd}`);
  }

  const year = Number.parseInt(raw.slice(0, 4), 10);
  const month = Number.parseInt(raw.slice(4, 6), 10) - 1;
  const day = Number.parseInt(raw.slice(6, 8), 10);
  const hour = Number.parseInt(raw.slice(8, 10), 10);
  const minute = Number.parseInt(raw.slice(10, 12), 10);
  const second = Number.parseInt(raw.slice(12, 14), 10);

  const utcMs =
    Date.UTC(year, month, day, hour, minute, second) -
    LIVESCORE.esdUtcOffsetHours * 60 * 60 * 1000;

  return new Date(utcMs);
}

async function fetchCompetitionDetails(): Promise<LiveScoreCompetitionDetails> {
  const response = await fetch(competitionDetailsUrl(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `LiveScore competition ${LIVESCORE.competitionId} failed: ${response.status}`
    );
  }

  return response.json() as Promise<LiveScoreCompetitionDetails>;
}

export async function fetchAllScheduleEvents(): Promise<LiveScoreNormalizedEvent[]> {
  const data = await fetchCompetitionDetails();
  const events: LiveScoreNormalizedEvent[] = [];

  for (const stage of data.Stages ?? []) {
    for (const event of stage.Events ?? []) {
      const normalized = normalizeEvent(event, stage);
      normalized.startTimestamp = Math.floor(
        parseLiveScoreKickoff(event.Esd).getTime() / 1000
      );
      events.push(normalized);
    }
  }

  return events.sort((left, right) => left.startTimestamp - right.startTimestamp);
}

export async function fetchEvent(eventId: number): Promise<LiveScoreNormalizedEvent> {
  const events = await fetchAllScheduleEvents();
  const event = events.find((item) => item.id === eventId);

  if (!event) {
    throw new Error(`LiveScore event ${eventId} was not found in competition schedule`);
  }

  return event;
}

export async function fetchRecentEvents(): Promise<LiveScoreNormalizedEvent[]> {
  const events = await fetchAllScheduleEvents();
  return events.filter((event) => event.statusCode.toUpperCase() === "FT");
}

export async function fetchLiveEvents(): Promise<LiveScoreNormalizedEvent[]> {
  const events = await fetchAllScheduleEvents();
  return events.filter((event) => {
    const code = event.statusCode.toUpperCase();
    return ["1H", "2H", "HT", "ET", "PT", "LIVE"].includes(code);
  });
}

export async function fetchUpcomingEvents(): Promise<LiveScoreNormalizedEvent[]> {
  const events = await fetchAllScheduleEvents();
  const now = Math.floor(Date.now() / 1000);
  return events.filter(
    (event) =>
      event.statusCode.toUpperCase() === "NS" && event.startTimestamp >= now - 3600
  );
}

export async function fetchMatchIncidents(
  eventId: number
): Promise<LiveScoreIncidentsResponse> {
  const { baseUrl, locale } = LIVESCORE;
  const url = `${baseUrl}/incidents/soccer/${eventId}?locale=${locale}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`LiveScore incidents ${eventId} failed: ${response.status}`);
  }

  return response.json() as Promise<LiveScoreIncidentsResponse>;
}
