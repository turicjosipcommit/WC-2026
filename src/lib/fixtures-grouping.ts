import type { Match, Prediction } from "@/lib/types";

export type RoundGroup<T> = {
  key: string;
  label: string;
  tabLabel: string;
  items: T[];
};

export type FixtureGroup = RoundGroup<{
  match: Match;
  prediction: Prediction | null;
}>;

export type PickGroup = RoundGroup<{
  prediction: Prediction;
  match: Match;
}>;

export function formatRoundTabLabel(match: Match) {
  if (match.stage === "Group stage" && match.round_number != null) {
    return `MD ${match.round_number}`;
  }

  if (match.round_number != null) {
    return `${match.stage} ${match.round_number}`;
  }

  return match.stage;
}

export function formatRoundLabel(match: Match) {
  if (match.stage === "Group stage" && match.round_number != null) {
    return `Matchday ${match.round_number}`;
  }

  if (match.round_number != null) {
    return `${match.stage} · Round ${match.round_number}`;
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
