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
  const { fetchAllPaginated } = await import("../src/lib/supabase/fetch-all");
  const {
    deriveScoreAt90FromGoals,
    shouldReconcileScoreAt90,
  } = await import("../src/lib/match-score-from-goals");

  const admin = createAdminClient();

  const matches = await fetchAllPaginated<Record<string, unknown>>((range) =>
    admin
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .eq("went_to_extra_time", true)
      .range(range.from, range.to)
  );

  let matchesUpdated = 0;
  let predictionsRescored = 0;

  for (const match of matches) {
    const { data: goals, error: goalsError } = await admin
      .from("match_goals")
      .select("minute, home_score_after, away_score_after, sort_order")
      .eq("match_id", match.id as string)
      .order("sort_order", { ascending: true });

    if (goalsError) {
      throw new Error(goalsError.message);
    }

    if (!goals?.length) {
      continue;
    }

    if (!shouldReconcileScoreAt90(match as never, goals)) {
      continue;
    }

    const derived = deriveScoreAt90FromGoals(goals);
    if (!derived) {
      continue;
    }

    if (
      match.home_score_90 === derived.home &&
      match.away_score_90 === derived.away
    ) {
      continue;
    }

    const { data: updated, error: updateError } = await admin
      .from("matches")
      .update({
        home_score_90: derived.home,
        away_score_90: derived.away,
      })
      .eq("id", match.id as string)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    matchesUpdated += 1;
    console.log(
      `${match.home_team} vs ${match.away_team}: 90′ ${match.home_score_90}-${match.away_score_90} → ${derived.home}-${derived.away}`
    );

    const { data: predictions, error: predError } = await admin
      .from("predictions")
      .select("*")
      .eq("match_id", match.id as string);

    if (predError) {
      throw new Error(predError.message);
    }

    for (const prediction of predictions ?? []) {
      const points = scorePredictionPhases(prediction, updated);
      const { error: scoreError } = await admin
        .from("predictions")
        .update(points)
        .eq("id", prediction.id);

      if (scoreError) {
        throw new Error(scoreError.message);
      }

      predictionsRescored += 1;
    }
  }

  console.log(
    JSON.stringify({ matchesUpdated, predictionsRescored }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
