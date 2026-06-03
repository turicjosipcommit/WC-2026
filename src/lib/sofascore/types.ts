export type SofaScoreStatusType =
  | "notstarted"
  | "inprogress"
  | "finished"
  | "postponed"
  | "canceled";

export interface SofaScoreEvent {
  id: number;
  startTimestamp: number;
  homeTeam: { name: string; slug?: string };
  awayTeam: { name: string; slug?: string };
  homeScore?: { current?: number | null };
  awayScore?: { current?: number | null };
  status: {
    type: SofaScoreStatusType;
    description?: string;
  };
  tournament?: {
    name?: string;
    groupName?: string;
  };
  roundInfo?: {
    round?: number;
    name?: string;
  };
}

export interface SofaScoreEventsResponse {
  events: SofaScoreEvent[];
}

export interface SofaScoreRoundsResponse {
  rounds: Array<{ round: number; name?: string; slug?: string }>;
  currentRound?: { round: number };
}
