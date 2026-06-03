export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Match {
  id: string;
  sofascore_event_id: number;
  home_team: string;
  away_team: string;
  group_name: string | null;
  stage: string;
  round_number: number | null;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  scored_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  pred_home: number;
  pred_away: number;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  total_points: number;
  predictions_count: number;
  exact_scores: number;
}

export interface MatchWithPrediction extends Match {
  prediction?: Prediction | null;
}
