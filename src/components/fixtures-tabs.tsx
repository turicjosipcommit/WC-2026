"use client";

import { MatchCard } from "@/components/match-card";
import { RoundTabs } from "@/components/round-tabs";
import type { FixtureGroup } from "@/lib/fixtures-grouping";

type FixturesTabsProps = {
  groups: FixtureGroup[];
  predictionsDisabled: boolean;
};

export function FixturesTabs({ groups, predictionsDisabled }: FixturesTabsProps) {
  return (
    <RoundTabs groups={groups} basePath="/fixtures" countLabel="match">
      {(items) => (
        <div className="grid gap-4">
          {items.map(({ match, prediction }) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={prediction}
              predictionsDisabled={predictionsDisabled}
            />
          ))}
        </div>
      )}
    </RoundTabs>
  );
}
