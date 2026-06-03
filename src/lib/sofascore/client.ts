import { chromium, type APIRequestContext } from "playwright";
import { SOFASCORE } from "./constants";
import type {
  SofaScoreEvent,
  SofaScoreEventsResponse,
  SofaScoreRoundsResponse,
} from "./types";

async function createAuthenticatedRequest(): Promise<{
  request: APIRequestContext;
  close: () => Promise<void>;
}> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  await page.goto(`${SOFASCORE.referer}#id:${SOFASCORE.seasonId}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2000);

  return {
    request: context.request,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

async function sofaGet<T>(path: string): Promise<T> {
  const { request, close } = await createAuthenticatedRequest();

  try {
    const response = await request.get(`${SOFASCORE.baseUrl}${path}`, {
      headers: {
        referer: SOFASCORE.referer,
        "x-requested-with": "XMLHttpRequest",
      },
    });

    if (!response.ok()) {
      throw new Error(`SofaScore ${path} failed: ${response.status()}`);
    }

    return (await response.json()) as T;
  } finally {
    await close();
  }
}

export async function fetchRounds(): Promise<SofaScoreRoundsResponse> {
  return sofaGet(
    `/unique-tournament/${SOFASCORE.tournamentId}/season/${SOFASCORE.seasonId}/rounds`
  );
}

export async function fetchEventsForRound(
  round: number
): Promise<SofaScoreEvent[]> {
  const data = await sofaGet<SofaScoreEventsResponse>(
    `/unique-tournament/${SOFASCORE.tournamentId}/season/${SOFASCORE.seasonId}/events/round/${round}`
  );
  return data.events ?? [];
}

export async function fetchUpcomingEvents(): Promise<SofaScoreEvent[]> {
  const data = await sofaGet<SofaScoreEventsResponse>(
    `/unique-tournament/${SOFASCORE.tournamentId}/season/${SOFASCORE.seasonId}/events/next/0`
  );
  return data.events ?? [];
}

export async function fetchRecentEvents(): Promise<SofaScoreEvent[]> {
  try {
    const data = await sofaGet<SofaScoreEventsResponse>(
      `/unique-tournament/${SOFASCORE.tournamentId}/season/${SOFASCORE.seasonId}/events/last/0`
    );
    return data.events ?? [];
  } catch {
    return [];
  }
}

export async function fetchEvent(eventId: number): Promise<SofaScoreEvent> {
  const data = await sofaGet<{ event: SofaScoreEvent }>(`/event/${eventId}`);
  return data.event;
}

export async function fetchAllScheduleEvents(): Promise<SofaScoreEvent[]> {
  const { rounds } = await fetchRounds();
  const roundNumbers = rounds.map((r) => r.round);
  const byId = new Map<number, SofaScoreEvent>();

  for (const round of roundNumbers) {
    const events = await fetchEventsForRound(round);
    for (const event of events) {
      byId.set(event.id, event);
    }
  }

  return [...byId.values()].sort(
    (a, b) => a.startTimestamp - b.startTimestamp
  );
}
