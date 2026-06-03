#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { syncResultsFromSofaScore } = await import("../src/lib/sofascore/sync");
  const result = await syncResultsFromSofaScore();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
