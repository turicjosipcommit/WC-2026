#!/usr/bin/env npx tsx
import { config } from "dotenv";

if (!process.env.CI) {
  config({ path: ".env.local" });
  if (process.env.WC_SYNC_ENV !== "production") {
    config({ path: ".env.development.local", override: true });
  }
}

async function main() {
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const { scorePredictionPhases } = await import("../src/lib/scoring");

  const admin = createAdminClient();
  const { data: matches, error } = await admin.from("matches").select("*").eq("status", "finished");

  if (error) {
    throw new Error(error.message);
  }

  let predictionsUpdated = 0;

  for (const match of matches ?? []) {
    const { data: predictions, error: predError } = await admin
      .from("predictions")
      .select("*")
      .eq("match_id", match.id);

    if (predError) {
      throw new Error(predError.message);
    }

    for (const prediction of predictions ?? []) {
      const points = scorePredictionPhases(prediction, match);
      const { error: updateError } = await admin
        .from("predictions")
        .update(points)
        .eq("id", prediction.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      predictionsUpdated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        finishedMatches: matches?.length ?? 0,
        predictionsUpdated,
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
