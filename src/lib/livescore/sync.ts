import { scorePredictionPhases } from "@/lib/scoring";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Match } from "@/lib/types";
import { fetchAllScheduleEvents, fetchMatchIncidents } from "./client";
import { parseGoalsFromIncidents } from "./incidents";
import { mapLiveScoreStatus, isLiveScoreInPlayStatus } from "./mappers";
import { recordLastSync } from "@/lib/sync-metadata";
import type { LiveScoreNormalizedEvent } from "./types";

function extractMatchScores(event: LiveScoreNormalizedEvent) {
  const homeCurrent = event.homeScore ?? null;
  const awayCurrent = event.awayScore ?? null;
  const home90 = event.homeScore90 ?? homeCurrent;
  const away90 = event.awayScore90 ?? awayCurrent;
  const homePen = event.homeScorePen ?? null;
  const awayPen = event.awayScorePen ?? null;
  const wentToPenalties = homePen != null && awayPen != null;
  const wentToExtraTime =
    wentToPenalties ||
    (event.homeScoreEt != null && event.awayScoreEt != null) ||
    event.statusCode.toUpperCase() === "AET";

  return {
    home_score: homeCurrent,
    away_score: awayCurrent,
    home_score_90: home90,
    away_score_90: away90,
    home_score_et: wentToExtraTime ? (event.homeScoreEt ?? homeCurrent) : null,
    away_score_et: wentToExtraTime ? (event.awayScoreEt ?? awayCurrent) : null,
    home_score_pen: homePen,
    away_score_pen: awayPen,
    went_to_extra_time: wentToExtraTime,
    went_to_penalties: wentToPenalties,
  };
}

function eventToMatchRow(event: LiveScoreNormalizedEvent) {
  const status = mapLiveScoreStatus(event.statusCode, event.statusId);
  const scores =
    status === "finished" || status === "live"
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
    livescore_event_id: event.id,
    home_team: event.homeTeam,
    away_team: event.awayTeam,
    home_team_img: event.homeTeamImg,
    away_team_img: event.awayTeamImg,
    group_name: event.groupName,
    stage: event.stage,
    kickoff_at: new Date(event.startTimestamp * 1000).toISOString(),
    status,
    ...scores,
    scored_at:
      status === "finished" &&
      scores.home_score != null &&
      scores.away_score != null
        ? new Date().toISOString()
        : null,
  };
}

export async function syncScheduleFromLiveScore() {
  const supabase = createAdminClient();
  const events = await fetchAllScheduleEvents();

  let upserted = 0;
  for (const event of events) {
    const row = eventToMatchRow(event);
    const { error } = await supabase.from("matches").upsert(row, {
      onConflict: "livescore_event_id",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Failed to upsert match ${event.id}: ${error.message}`);
    }
    upserted += 1;
  }

  await recordLastSync();

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

async function syncMatchGoals(matchId: string, livescoreEventId: number) {
  const supabase = createAdminClient();
  const incidents = await fetchMatchIncidents(livescoreEventId);
  const goals = parseGoalsFromIncidents(incidents);

  const { error: deleteError } = await supabase
    .from("match_goals")
    .delete()
    .eq("match_id", matchId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (goals.length === 0) {
    return 0;
  }

  const { error: insertError } = await supabase.from("match_goals").insert(
    goals.map((goal) => ({
      match_id: matchId,
      ...goal,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }

  return goals.length;
}

async function applyEventUpdate(event: LiveScoreNormalizedEvent) {
  const supabase = createAdminClient();
  const row = eventToMatchRow(event);

  const { data: existing, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("livescore_event_id", event.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data: updated, error: upsertError } = await supabase
    .from("matches")
    .upsert(row, { onConflict: "livescore_event_id" })
    .select("*")
    .single();

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const wasFinished = existing?.status === "finished";
  const isFinished = updated.status === "finished";
  const isLive = updated.status === "live";
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

  let goalsSynced = 0;
  if (isLive || isFinished) {
    goalsSynced = await syncMatchGoals(updated.id, event.id);
  }

  if (isFinished && (!wasFinished || scoresChanged)) {
    const scored = await scoreMatchPredictions(updated as Match);
    return { updated: true, scored, goalsSynced };
  }

  return { updated: true, scored: 0, goalsSynced };
}

export async function syncResultsFromLiveScore() {
  const supabase = createAdminClient();

  const liveCandidates = await supabase
    .from("matches")
    .select("livescore_event_id")
    .in("status", ["scheduled", "live"])
    .lte("kickoff_at", new Date().toISOString());

  const allEvents = await fetchAllScheduleEvents();
  const eventsById = new Map(allEvents.map((event) => [event.id, event]));

  const candidateIds = new Set<number>([
    ...allEvents
      .filter((event) => {
        const code = event.statusCode.toUpperCase();
        return (
          code === "FT" ||
          code === "AET" ||
          code === "AP" ||
          isLiveScoreInPlayStatus(code, event.statusId)
        );
      })
      .map((event) => event.id),
    ...(liveCandidates.data ?? []).map((match) => match.livescore_event_id),
  ]);

  let updated = 0;
  let scoredPredictions = 0;
  let goalsSynced = 0;

  for (const eventId of candidateIds) {
    const event = eventsById.get(eventId);
    if (!event) continue;

    const result = await applyEventUpdate(event);
    if (result.updated) updated += 1;
    scoredPredictions += result.scored;
    goalsSynced += result.goalsSynced;
  }

  await recordLastSync();

  return {
    checked: candidateIds.size,
    updated,
    scoredPredictions,
    goalsSynced,
  };
}
