import { calculatePoints } from "@/lib/scoring";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Match } from "@/lib/types";
import {
  fetchAllScheduleEvents,
  fetchEvent,
  fetchRecentEvents,
  fetchUpcomingEvents,
  closeSofaSession,
} from "./client";
import {
  extractGroupName,
  extractStage,
  mapSofaScoreStatus,
} from "./mappers";
import type { SofaScoreEvent } from "./types";

function eventToMatchRow(event: SofaScoreEvent) {
  const status = mapSofaScoreStatus(event.status.type);
  const homeScore = event.homeScore?.current ?? null;
  const awayScore = event.awayScore?.current ?? null;

  return {
    sofascore_event_id: event.id,
    home_team: event.homeTeam.name,
    away_team: event.awayTeam.name,
    group_name: extractGroupName(event),
    stage: extractStage(event),
    round_number: event.roundInfo?.round ?? null,
    kickoff_at: new Date(event.startTimestamp * 1000).toISOString(),
    status,
    home_score: status === "finished" ? homeScore : null,
    away_score: status === "finished" ? awayScore : null,
    scored_at:
      status === "finished" && homeScore != null && awayScore != null
        ? new Date().toISOString()
        : null,
  };
}

export async function syncScheduleFromSofaScore() {
  const supabase = createAdminClient();
  const events = await fetchAllScheduleEvents();

  let upserted = 0;
  for (const event of events) {
    const row = eventToMatchRow(event);
    const { error } = await supabase.from("matches").upsert(row, {
      onConflict: "sofascore_event_id",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Failed to upsert match ${event.id}: ${error.message}`);
    }
    upserted += 1;
  }

  return { upserted, total: events.length };
}

async function scoreMatchPredictions(match: Match) {
  if (
    match.home_score == null ||
    match.away_score == null ||
    match.status !== "finished"
  ) {
    return 0;
  }

  const supabase = createAdminClient();
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", match.id);

  if (error) {
    throw new Error(error.message);
  }

  let scored = 0;
  for (const prediction of predictions ?? []) {
    const points = calculatePoints(
      prediction.pred_home,
      prediction.pred_away,
      match.home_score,
      match.away_score
    );

    const { error: updateError } = await supabase
      .from("predictions")
      .update({ points_awarded: points })
      .eq("id", prediction.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    scored += 1;
  }

  return scored;
}

async function applyEventUpdate(event: SofaScoreEvent) {
  const supabase = createAdminClient();
  const row = eventToMatchRow(event);

  const { data: existing, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("sofascore_event_id", event.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data: updated, error: upsertError } = await supabase
    .from("matches")
    .upsert(row, { onConflict: "sofascore_event_id" })
    .select("*")
    .single();

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const wasFinished = existing?.status === "finished";
  const isFinished = updated.status === "finished";
  const scoresChanged =
    existing?.home_score !== updated.home_score ||
    existing?.away_score !== updated.away_score;

  if (isFinished && (!wasFinished || scoresChanged)) {
    const scored = await scoreMatchPredictions(updated as Match);
    return { updated: true, scored };
  }

  return { updated: true, scored: 0 };
}

export async function syncResultsFromSofaScore() {
  const supabase = createAdminClient();

  try {
    const liveCandidates = await supabase
      .from("matches")
      .select("sofascore_event_id")
      .in("status", ["scheduled", "live"])
      .lte("kickoff_at", new Date().toISOString());

    const recent = await fetchRecentEvents();
    const upcoming = await fetchUpcomingEvents();
    const candidateIds = new Set<number>([
      ...recent.map((e) => e.id),
      ...upcoming.filter((e) => e.status.type === "inprogress").map((e) => e.id),
      ...(liveCandidates.data ?? []).map((m) => m.sofascore_event_id),
    ]);

    let updated = 0;
    let scoredPredictions = 0;

    for (const eventId of candidateIds) {
      const event = await fetchEvent(eventId);
      const result = await applyEventUpdate(event);
      if (result.updated) updated += 1;
      scoredPredictions += result.scored;
    }

    return {
      checked: candidateIds.size,
      updated,
      scoredPredictions,
    };
  } finally {
    await closeSofaSession();
  }
}
