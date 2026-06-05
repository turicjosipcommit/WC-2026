"use client";

import { MyPickCard } from "@/components/my-pick-card";
import { RoundTabs } from "@/components/round-tabs";
import type { PickGroup } from "@/lib/fixtures-grouping";

type MyPicksTabsProps = {
  groups: PickGroup[];
  defaultRoundKey?: string;
  predictionsDisabled?: boolean;
};

export function MyPicksTabs({
  groups,
  defaultRoundKey,
  predictionsDisabled = false,
}: MyPicksTabsProps) {
  return (
    <RoundTabs
      groups={groups}
      basePath="/my-picks"
      defaultRoundKey={defaultRoundKey}
    >
      {(items) => (
        <div className="grid gap-3">
          {items.map(({ prediction, match }) => (
            <MyPickCard
              key={prediction.id}
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
