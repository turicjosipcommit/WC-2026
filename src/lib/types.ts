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
  livescore_event_id: number;
  home_team: string;
  away_team: string;
  home_team_img: string | null;
  away_team_img: string | null;
  group_name: string | null;
  stage: string;
  round_number: number | null;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  home_score_90: number | null;
  away_score_90: number | null;
  home_score_et: number | null;
  away_score_et: number | null;
  home_score_pen: number | null;
  away_score_pen: number | null;
  went_to_extra_time: boolean;
  went_to_penalties: boolean;
  scored_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MatchGoalType = "goal" | "own_goal" | "penalty";

export interface MatchGoal {
  id: string;
  match_id: string;
  minute: number;
  stoppage_minute: number | null;
  period: number;
  team: "home" | "away";
  player_name: string;
  goal_type: MatchGoalType;
  home_score_after: number;
  away_score_after: number;
  sort_order: number;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  pred_home: number;
  pred_away: number;
  pred_et_home: number | null;
  pred_et_away: number | null;
  pred_pen_home: number | null;
  pred_pen_away: number | null;
  points_awarded: number | null;
  et_points_awarded: number | null;
  pen_points_awarded: number | null;
  created_at: string;
  updated_at: string;
}

export interface PointsBreakdown {
  exact: number;
  resultAndOneTeam: number;
  resultOnly: number;
  oneTeamOnly: number;
  none: number;
  pending: number;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  total_points: number;
  predictions_count: number;
  exact_scores: number;
  correct_results: number;
  points_breakdown: PointsBreakdown;
}

export interface MatchWithPrediction extends Match {
  prediction?: Prediction | null;
}
