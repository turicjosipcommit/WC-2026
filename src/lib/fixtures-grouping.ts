import { UNKNOWN_DISPLAY_NAME } from "@/lib/i18n";
import type { Match, MatchGoal, Prediction, Profile } from "@/lib/types";

export type RoundGroup<T> = {
  key: string;
  label: string;
  tabLabel: string;
  items: T[];
};

export type OtherPick = {
  userId: string;
  displayName: string;
  predHome: number;
  predAway: number;
  predEtHome: number | null;
  predEtAway: number | null;
  predPenHome: number | null;
  predPenAway: number | null;
  pointsAwarded: number | null;
  etPointsAwarded: number | null;
  penPointsAwarded: number | null;
};

export type FixtureGroup = RoundGroup<{
  match: Match;
  prediction: Prediction | null;
  otherPicks: OtherPick[];
  goals: MatchGoal[];
}>;

export type FixtureStatusFilter = "all" | "scheduled" | "active" | "finished";

export const FIXTURE_STATUS_FILTERS: {
  id: FixtureStatusFilter;
  label: string;
}[] = [
  { id: "all", label: "Sve" },
  { id: "scheduled", label: "Zakazano" },
  { id: "active", label: "U tijeku" },
  { id: "finished", label: "Završeno" },
];

export function parseFixtureStatusFilter(value: string | null): FixtureStatusFilter {
  if (value === "scheduled" || value === "active" || value === "finished") {
    return value;
  }
  return "all";
}

export function matchesFixtureStatusFilter(
  match: Pick<Match, "status">,
  filter: FixtureStatusFilter
) {
  if (filter === "all") return true;
  if (filter === "scheduled") {
    return match.status === "scheduled" || match.status === "postponed";
  }
  if (filter === "active") return match.status === "live";
  return match.status === "finished";
}

export type FixturePickFilter = "all" | "picked" | "unpicked";

export const FIXTURE_PICK_FILTERS: {
  id: FixturePickFilter;
  label: string;
}[] = [
  { id: "all", label: "Sve" },
  { id: "picked", label: "Prognozirano" },
  { id: "unpicked", label: "Bez prognoze" },
];

export function parseFixturePickFilter(value: string | null): FixturePickFilter {
  if (value === "picked" || value === "unpicked") {
    return value;
  }
  return "all";
}

export function matchesFixturePickFilter(
  item: Pick<FixtureGroup["items"][number], "prediction">,
  filter: FixturePickFilter
) {
  if (filter === "all") return true;
  const hasPick = item.prediction != null;
  return filter === "picked" ? hasPick : !hasPick;
}

export function groupOtherPicksByMatch(
  predictions: Pick<
    Prediction,
    | "user_id"
    | "match_id"
    | "pred_home"
    | "pred_away"
    | "pred_et_home"
    | "pred_et_away"
    | "pred_pen_home"
    | "pred_pen_away"
    | "points_awarded"
    | "et_points_awarded"
    | "pen_points_awarded"
  >[],
  profiles: Pick<Profile, "id" | "display_name">[],
  currentUserId?: string | null
) {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile.display_name]));
  const byMatch = new Map<string, OtherPick[]>();

  for (const prediction of predictions) {
    if (currentUserId && prediction.user_id === currentUserId) continue;

    const pick: OtherPick = {
      userId: prediction.user_id,
      displayName: profileById.get(prediction.user_id) ?? UNKNOWN_DISPLAY_NAME,
      predHome: prediction.pred_home,
      predAway: prediction.pred_away,
      predEtHome: prediction.pred_et_home,
      predEtAway: prediction.pred_et_away,
      predPenHome: prediction.pred_pen_home,
      predPenAway: prediction.pred_pen_away,
      pointsAwarded: prediction.points_awarded,
      etPointsAwarded: prediction.et_points_awarded,
      penPointsAwarded: prediction.pen_points_awarded,
    };

    const list = byMatch.get(prediction.match_id) ?? [];
    list.push(pick);
    byMatch.set(prediction.match_id, list);
  }

  for (const list of byMatch.values()) {
    list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return byMatch;
}

export type PickGroup = RoundGroup<{
  prediction: Prediction;
  match: Match;
}>;

export function formatRoundTabLabel(match: Match) {
  if (match.stage === "Group stage" && match.round_number != null) {
    return `K${match.round_number}`;
  }

  if (match.round_number != null) {
    return `${match.stage} ${match.round_number}`;
  }

  return match.stage;
}

export function formatRoundLabel(match: Match) {
  if (match.stage === "Group stage" && match.round_number != null) {
    return `Kolo ${match.round_number}`;
  }

  if (match.round_number != null) {
    return `${match.stage} · Kolo ${match.round_number}`;
  }

  return match.stage;
}

export function groupByRound<T extends { match: Match }>(items: T[]): RoundGroup<T>[] {
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      tabLabel: string;
      firstKickoff: number;
      items: T[];
    }
  >();

  for (const item of items) {
    const { match } = item;
    const key = `${match.stage}\0${match.round_number ?? ""}`;
    const label = formatRoundLabel(match);
    const tabLabel = formatRoundTabLabel(match);
    const kickoff = new Date(match.kickoff_at).getTime();

    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      existing.firstKickoff = Math.min(existing.firstKickoff, kickoff);
    } else {
      groups.set(key, { key, label, tabLabel, firstKickoff: kickoff, items: [item] });
    }
  }

  return [...groups.values()]
    .sort((a, b) => a.firstKickoff - b.firstKickoff)
    .map(({ key, label, tabLabel, items }) => ({ key, label, tabLabel, items }));
}

export function groupFixturesByRound(
  fixtures: FixtureGroup["items"]
): FixtureGroup[] {
  return groupByRound(fixtures);
}

export function groupPicksByRound(picks: PickGroup["items"]): PickGroup[] {
  return groupByRound(
    [...picks].sort(
      (a, b) =>
        new Date(a.match.kickoff_at).getTime() -
        new Date(b.match.kickoff_at).getTime()
    )
  );
}

export function groupKeyToParam(key: string) {
  return encodeURIComponent(key);
}

export function paramToGroupKey(param: string) {
  return decodeURIComponent(param);
}

export function pickDefaultGroupKey(
  groups: { key: string; items: { match: Match }[] }[]
) {
  const now = Date.now();

  const nextScheduled = groups.find((group) =>
    group.items.some(
      ({ match }) =>
        match.status === "scheduled" && new Date(match.kickoff_at).getTime() > now
    )
  );
  if (nextScheduled) return nextScheduled.key;

  const live = groups.find((group) =>
    group.items.some(({ match }) => match.status === "live")
  );
  if (live) return live.key;

  const lastWithOpenPicks = [...groups]
    .reverse()
    .find((group) =>
      group.items.some(({ match }) =>
        ["scheduled", "postponed"].includes(match.status)
      )
    );
  if (lastWithOpenPicks) return lastWithOpenPicks.key;

  return groups[0]?.key ?? "";
}
