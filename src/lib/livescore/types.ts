export interface LiveScoreTeam {
  Nm: string;
  ID?: string;
  Abr?: string;
}

export interface LiveScoreEvent {
  Eid: string;
  T1: LiveScoreTeam[];
  T2: LiveScoreTeam[];
  Eps: string;
  Esid?: number;
  Esd: number;
  ErnInf?: string;
  Tr1?: string;
  Tr2?: string;
  Trh1?: string;
  Trh2?: string;
  Tr1ET?: string;
  Tr2ET?: string;
  Trp1?: string;
  Trp2?: string;
  Ewt?: number;
}

export interface LiveScoreStage {
  Snm: string;
  Scd: string;
  Events?: LiveScoreEvent[];
}

export interface LiveScoreCompetitionDetails {
  CompN: string;
  CompId: string;
  Stages: LiveScoreStage[];
}

export interface LiveScoreNormalizedEvent {
  id: number;
  homeTeam: string;
  awayTeam: string;
  groupName: string | null;
  stage: string;
  roundNumber: number | null;
  startTimestamp: number;
  statusCode: string;
  homeScore: number | null;
  awayScore: number | null;
  homeScore90: number | null;
  awayScore90: number | null;
  homeScoreEt: number | null;
  awayScoreEt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
}
