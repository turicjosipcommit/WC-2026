"use client";

import { RoundTabs } from "@/components/round-tabs";
import type { PickGroup } from "@/lib/fixtures-grouping";

type MyPicksTabsProps = {
  groups: PickGroup[];
  defaultRoundKey?: string;
};

export function MyPicksTabs({ groups, defaultRoundKey }: MyPicksTabsProps) {
  return (
    <RoundTabs
      groups={groups}
      basePath="/my-picks"
      defaultRoundKey={defaultRoundKey}
    >
      {(items) => (
        <div className="grid gap-3">
          {items.map(({ prediction, match }) => (
            <article
              key={prediction.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">
                  {match.home_team} vs {match.away_team}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(match.kickoff_at).toLocaleString()}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <p>
                  Pick:{" "}
                  <span className="font-semibold text-slate-900">
                    {prediction.pred_home} - {prediction.pred_away}
                  </span>
                </p>
                {match.status === "finished" && match.home_score != null && (
                  <p className="text-slate-600">
                    Result: {match.home_score} - {match.away_score}
                  </p>
                )}
                {prediction.points_awarded != null && (
                  <p className="font-semibold text-emerald-600">
                    +{prediction.points_awarded} pts
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </RoundTabs>
  );
}
