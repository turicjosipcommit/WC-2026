#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });
if (!process.env.CI && process.env.WC_SYNC_ENV !== "production") {
  config({ path: ".env.development.local", override: true });
}

async function main() {
  const { syncResultsFromLiveScore } = await import("../src/lib/livescore/sync");
  const result = await syncResultsFromLiveScore();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
