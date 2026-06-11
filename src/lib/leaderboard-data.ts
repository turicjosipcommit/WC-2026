import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaderboardPredictionInput } from "@/lib/leaderboard";

const PREDICTION_SELECT = `
  user_id,
  pred_home,
  pred_away,
  pred_et_home,
  pred_et_away,
  pred_pen_home,
  pred_pen_away,
  points_awarded,
  et_points_awarded,
  pen_points_awarded,
  matches (
    status,
    home_score,
    away_score,
    home_score_90,
    away_score_90,
    home_score_et,
    away_score_et,
    home_score_pen,
    away_score_pen,
    went_to_extra_time,
    went_to_penalties
  )
`;

type RawPredictionRow = {
  user_id: string;
  pred_home: number;
  pred_away: number;
  pred_et_home: number | null;
  pred_et_away: number | null;
  pred_pen_home: number | null;
  pred_pen_away: number | null;
  points_awarded: number | null;
  et_points_awarded: number | null;
  pen_points_awarded: number | null;
  matches:
    | LeaderboardPredictionInput["match"]
    | LeaderboardPredictionInput["match"][]
    | null;
};

function normalizeMatch(
  match: RawPredictionRow["matches"]
): LeaderboardPredictionInput["match"] {
  if (Array.isArray(match)) {
    return match[0] ?? null;
  }

  return match ?? null;
}

export async function fetchLeaderboardInput(supabase: SupabaseClient) {
  const [
    { data: profiles, error: profilesError },
    { data: predictions, error: predictionsError },
    { count: liveMatchCount, error: liveCountError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("predictions").select(PREDICTION_SELECT),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  if (liveCountError) {
    throw new Error(liveCountError.message);
  }

  const normalizedPredictions: LeaderboardPredictionInput[] = (predictions ?? []).map(
    (row) => {
      const prediction = row as RawPredictionRow;

      return {
        user_id: prediction.user_id,
        pred_home: prediction.pred_home,
        pred_away: prediction.pred_away,
        pred_et_home: prediction.pred_et_home,
        pred_et_away: prediction.pred_et_away,
        pred_pen_home: prediction.pred_pen_home,
        pred_pen_away: prediction.pred_pen_away,
        points_awarded: prediction.points_awarded,
        et_points_awarded: prediction.et_points_awarded,
        pen_points_awarded: prediction.pen_points_awarded,
        match: normalizeMatch(prediction.matches),
      };
    }
  );

  return {
    profiles: profiles ?? [],
    predictions: normalizedPredictions,
    liveMatchCount: liveMatchCount ?? 0,
  };
}
