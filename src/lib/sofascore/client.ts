import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { SOFASCORE } from "./constants";
import type {
  SofaScoreEvent,
  SofaScoreEventsResponse,
  SofaScoreRoundsResponse,
} from "./types";

type SofaSession = {
  page: Page;
  close: () => Promise<void>;
};

let cachedSession: Promise<SofaSession> | null = null;

async function openSession(): Promise<SofaSession> {
  const browser: Browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  await page.goto(`${SOFASCORE.referer}#id:${SOFASCORE.seasonId}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  await page
    .waitForResponse(
      (resp) =>
        resp.url().includes("/api/v1/unique-tournament/16/season/58210") &&
        resp.status() === 200,
      { timeout: 30000 }
    )
    .catch(() => undefined);

  return {
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

async function getSession(): Promise<SofaSession> {
  if (!cachedSession) {
    cachedSession = openSession();
  }
  return cachedSession;
}

export async function closeSofaSession() {
  if (cachedSession) {
    const session = await cachedSession;
    await session.close();
    cachedSession = null;
  }
}

async function sofaGet<T>(path: string): Promise<T> {
  const session = await getSession();
  const url = `${SOFASCORE.baseUrl}${path}`;

  const result = await session.page.evaluate(async (fetchUrl) => {
    const response = await fetch(fetchUrl, {
      credentials: "include",
      headers: { accept: "application/json, text/plain, */*" },
    });

    if (!response.ok) {
      return { ok: false as const, status: response.status, data: null };
    }

    return { ok: true as const, status: response.status, data: await response.json() };
  }, url);

  if (!result.ok) {
    throw new Error(`SofaScore ${path} failed: ${result.status}`);
  }

  return result.data as T;
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
  try {
    const { rounds } = await fetchRounds();
    const roundNumbers = rounds.map((r) => r.round);
    const byId = new Map<number, SofaScoreEvent>();

    for (const round of roundNumbers) {
      try {
        const events = await fetchEventsForRound(round);
        for (const event of events) {
          byId.set(event.id, event);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes(" failed: 404")) {
          throw error;
        }
      }
    }

    return [...byId.values()].sort(
      (a, b) => a.startTimestamp - b.startTimestamp
    );
  } finally {
    await closeSofaSession();
  }
}
