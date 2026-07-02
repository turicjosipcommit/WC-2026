#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });
if (process.env.WC_SYNC_ENV !== "production") {
  config({ path: ".env.development.local", override: true });
}

async function main() {
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const { scorePredictionPhases, sumPhasePoints } = await import("../src/lib/scoring");

  const admin = createAdminClient();
  const name = process.argv[2] ?? "Luka Stanić";

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", `%${name.split(" ")[0]}%`);

  if (profileError) throw profileError;

  const profile = profiles?.find((p) =>
    p.display_name.toLowerCase().includes(name.toLowerCase().split(" ")[0] ?? "")
  ) ?? profiles?.[0];

  if (!profile) {
    console.log(`Profil nije pronađen za: ${name}`);
    console.log("Dostupni profili:", profiles?.map((p) => p.display_name));
    return;
  }

  const { data: predictions, error: predError } = await admin
    .from("predictions")
    .select(
      "*, match:matches(id, home_team, away_team, status, home_score, away_score, home_score_90, away_score_90, home_score_et, away_score_et, home_score_pen, away_score_pen, went_to_extra_time, went_to_penalties, kickoff_at)"
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  if (predError) throw predError;

  let expectedTotal = 0;
  let storedTotal = 0;
  let mismatchCount = 0;

  console.log(`\n${profile.display_name} (${profile.id})\n`);
  console.log(
    "Utakmica".padEnd(36),
    "Prognoza".padEnd(12),
    "Rezultat".padEnd(10),
    "Oček.".padEnd(6),
    "U bazi".padEnd(6),
    "Status"
  );
  console.log("-".repeat(90));

  for (const row of predictions ?? []) {
    const match = Array.isArray(row.match) ? row.match[0] : row.match;
    if (!match) continue;

    const pred = `${row.pred_home}-${row.pred_away}`;
    const actual =
      match.status === "finished"
        ? `${match.home_score_90 ?? match.home_score}-${match.away_score_90 ?? match.away_score}`
        : match.status === "live"
          ? `${match.home_score_90 ?? match.home_score ?? "?"}-${match.away_score_90 ?? match.away_score ?? "?"}`
          : "—";

    const stored =
      (row.points_awarded ?? 0) +
      (row.et_points_awarded ?? 0) +
      (row.pen_points_awarded ?? 0);

    let expected = 0;
    let note = match.status;

    if (match.status === "finished") {
      const phases = scorePredictionPhases(row, match);
      expected = sumPhasePoints(phases);
      if (expected !== stored) {
        mismatchCount += 1;
        note = `MISMATCH (90:${phases.points_awarded} et:${phases.et_points_awarded} pen:${phases.pen_points_awarded})`;
      }
    } else if (match.status === "live") {
      note = "live (nije konačno)";
    } else {
      note = match.status;
    }

    if (match.status === "finished") {
      expectedTotal += expected;
      storedTotal += stored;
    }

    const label = `${match.home_team} vs ${match.away_team}`.slice(0, 35);
    console.log(
      label.padEnd(36),
      pred.padEnd(12),
      actual.padEnd(10),
      String(match.status === "finished" ? expected : "—").padEnd(6),
      String(match.status === "finished" ? stored : "—").padEnd(6),
      note
    );
  }

  const finishedCount =
    predictions?.filter((p) => {
      const m = Array.isArray(p.match) ? p.match[0] : p.match;
      return m?.status === "finished";
    }).length ?? 0;

  console.log("-".repeat(90));
  console.log(`Završene utakmice: ${finishedCount}`);
  console.log(`Očekivani ukupni bodovi (završene): ${expectedTotal}`);
  console.log(`Spremi u bazi (završene):           ${storedTotal}`);
  console.log(`Razlika:                             ${expectedTotal - storedTotal}`);
  if (mismatchCount > 0) {
    console.log(`\n⚠ ${mismatchCount} utakmica s razlikom između očekivanog i spremljenog.`);
  }
}

main().catch(console.error);
