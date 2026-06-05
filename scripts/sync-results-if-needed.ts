#!/usr/bin/env npx tsx
import { config } from "dotenv";

if (!process.env.CI) {
  config({ path: ".env.local" });
  if (process.env.WC_SYNC_ENV !== "production") {
    config({ path: ".env.development.local", override: true });
  }
}

async function main() {
  const { evaluateResultsSync } = await import("../src/lib/sync-window");
  const force = process.env.SYNC_FORCE === "1";
  const decision = await evaluateResultsSync({ force });

  if (!decision.run) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          reason: decision.reason,
          activeMatches: decision.activeMatches.length,
        },
        null,
        2
      )
    );
    return;
  }

  if (decision.reason === "fallback") {
    try {
      const { syncScheduleFromLiveScore } = await import("../src/lib/livescore/sync");
      const schedule = await syncScheduleFromLiveScore();
      console.log(JSON.stringify({ ok: true, schedule }, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Schedule sync failed";
      console.warn(JSON.stringify({ ok: false, scheduleError: message }));
    }
  }

  const { syncResultsFromLiveScore } = await import("../src/lib/livescore/sync");
  const result = await syncResultsFromLiveScore();

  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: false,
        reason: decision.reason,
        activeMatches: decision.activeMatches.map((match) => ({
          id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          status: match.status,
        })),
        ...result,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
