import { scorePredictionPhases } from "@/lib/scoring";
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

function extractMatchScores(event: SofaScoreEvent) {
  const homeCurrent = event.homeScore?.current ?? null;
  const awayCurrent = event.awayScore?.current ?? null;
  const home90 = event.homeScore?.normaltime ?? homeCurrent;
  const away90 = event.awayScore?.normaltime ?? awayCurrent;
  const homePen = event.homeScore?.penalties ?? null;
  const awayPen = event.awayScore?.penalties ?? null;
  const wentToPenalties = homePen != null && awayPen != null;
  const wentToExtraTime =
    wentToPenalties ||
    (event.homeScore?.overtime != null && event.homeScore.overtime > 0) ||
    (event.status.description?.toLowerCase().includes("aet") ?? false);

  return {
    home_score: homeCurrent,
    away_score: awayCurrent,
    home_score_90: home90,
    away_score_90: away90,
    home_score_et: wentToExtraTime ? homeCurrent : null,
    away_score_et: wentToExtraTime ? awayCurrent : null,
    home_score_pen: homePen,
    away_score_pen: awayPen,
    went_to_extra_time: wentToExtraTime,
    went_to_penalties: wentToPenalties,
  };
}

function eventToMatchRow(event: SofaScoreEvent) {
  const status = mapSofaScoreStatus(event.status.type);
  const scores =
    status === "finished"
      ? extractMatchScores(event)
      : {
          home_score: null,
          away_score: null,
          home_score_90: null,
          away_score_90: null,
          home_score_et: null,
          away_score_et: null,
          home_score_pen: null,
          away_score_pen: null,
          went_to_extra_time: false,
          went_to_penalties: false,
        };

  return {
    sofascore_event_id: event.id,
    home_team: event.homeTeam.name,
    away_team: event.awayTeam.name,
    group_name: extractGroupName(event),
    stage: extractStage(event),
    round_number: event.roundInfo?.round ?? null,
    kickoff_at: new Date(event.startTimestamp * 1000).toISOString(),
    status,
    ...scores,
    scored_at:
      status === "finished" && scores.home_score != null && scores.away_score != null
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
  if (match.status !== "finished") {
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
    const points = scorePredictionPhases(prediction, match);

    const { error: updateError } = await supabase
      .from("predictions")
      .update(points)
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
    existing?.away_score !== updated.away_score ||
    existing?.home_score_90 !== updated.home_score_90 ||
    existing?.away_score_90 !== updated.away_score_90 ||
    existing?.home_score_et !== updated.home_score_et ||
    existing?.away_score_et !== updated.away_score_et ||
    existing?.home_score_pen !== updated.home_score_pen ||
    existing?.away_score_pen !== updated.away_score_pen ||
    existing?.went_to_extra_time !== updated.went_to_extra_time ||
    existing?.went_to_penalties !== updated.went_to_penalties;

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
