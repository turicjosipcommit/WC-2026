import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction } from "@/lib/types";

export type MyPick = {
  prediction: Prediction;
  match: Match;
};

export async function fetchMyPicks(): Promise<{
  picks: MyPick[];
  error: string | null;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { picks: [], error: null, userId: null };
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (predictionsError) {
    return {
      picks: [],
      error: predictionsError.message,
      userId: user.id,
    };
  }

  if (!predictions?.length) {
    return { picks: [], error: null, userId: user.id };
  }

  const matchIds = [...new Set(predictions.map((p) => p.match_id))];

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .in("id", matchIds);

  if (matchesError) {
    return {
      picks: [],
      error: matchesError.message,
      userId: user.id,
    };
  }

  const matchById = new Map((matches ?? []).map((m) => [m.id, m as Match]));

  const picks: MyPick[] = [];

  for (const prediction of predictions) {
    const match = matchById.get(prediction.match_id);
    if (!match) continue;
    picks.push({ prediction: prediction as Prediction, match });
  }

  const missingMatches = predictions.length - picks.length;

  return {
    picks,
    error:
      missingMatches > 0
        ? `${missingMatches} prediction(s) could not be linked to a match.`
        : null,
    userId: user.id,
  };
}
