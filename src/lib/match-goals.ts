import type { MatchGoal } from "@/lib/types";

export function formatGoalMinute(goal: Pick<MatchGoal, "minute" | "stoppage_minute">) {
  if (goal.stoppage_minute != null && goal.stoppage_minute > 0) {
    return `${goal.minute}+${goal.stoppage_minute}'`;
  }
  return `${goal.minute}'`;
}

export function formatGoalLabel(goal: MatchGoal) {
  const suffix =
    goal.goal_type === "own_goal" ? " (OG)" : goal.goal_type === "penalty" ? " (P)" : "";
  return `${formatGoalMinute(goal)} ${goal.player_name}${suffix}`;
}

export function groupGoalsByTeam(goals: MatchGoal[]) {
  return {
    home: goals.filter((goal) => goal.team === "home"),
    away: goals.filter((goal) => goal.team === "away"),
  };
}
