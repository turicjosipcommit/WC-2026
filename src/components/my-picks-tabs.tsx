"use client";

import { RoundTabs } from "@/components/round-tabs";
import type { PickGroup } from "@/lib/fixtures-grouping";
import {
  formatPredictionSummary,
  formatScoreLine,
  hasScoredPrediction,
  totalPredictionPoints,
} from "@/lib/match-phase";

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
          {items.map(({ prediction, match }) => {
            const ftResult = formatScoreLine(
              match.home_score_90 ?? match.home_score,
              match.away_score_90 ?? match.away_score
            );

            return (
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
                      {formatPredictionSummary(prediction)}
                    </span>
                  </p>
                  {match.status === "finished" && ftResult && (
                    <p className="text-slate-600">FT: {ftResult}</p>
                  )}
                  {match.status === "finished" && match.went_to_extra_time && (
                    <p className="text-slate-600">
                      AET: {formatScoreLine(match.home_score_et, match.away_score_et)}
                    </p>
                  )}
                  {match.status === "finished" && match.went_to_penalties && (
                    <p className="text-slate-600">
                      Pens: {formatScoreLine(match.home_score_pen, match.away_score_pen)}
                    </p>
                  )}
                  {hasScoredPrediction(prediction) && (
                    <p className="font-semibold text-emerald-600">
                      +{totalPredictionPoints(prediction)} pts
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </RoundTabs>
  );
}
