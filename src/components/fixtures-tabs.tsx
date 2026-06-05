"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MatchCard } from "@/components/match-card";
import { RoundTabs } from "@/components/round-tabs";
import {
  FIXTURE_STATUS_FILTERS,
  groupFixturesByRound,
  matchesFixtureStatusFilter,
  parseFixtureStatusFilter,
  type FixtureGroup,
  type FixtureStatusFilter,
} from "@/lib/fixtures-grouping";

type FixturesTabsProps = {
  groups: FixtureGroup[];
  predictionsDisabled: boolean;
};

export function FixturesTabs({ groups, predictionsDisabled }: FixturesTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = parseFixtureStatusFilter(searchParams.get("status"));

  const filteredGroups = useMemo(() => {
    const items = groups.flatMap((group) => group.items);
    const filtered = items.filter((item) =>
      matchesFixtureStatusFilter(item.match, statusFilter)
    );
    return groupFixturesByRound(filtered);
  }, [groups, statusFilter]);

  const selectStatus = useCallback(
    (filter: FixtureStatusFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") {
        params.delete("status");
      } else {
        params.set("status", filter);
      }
      router.replace(`/fixtures?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const totalFiltered = filteredGroups.reduce(
    (count, group) => count + group.items.length,
    0
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Match status"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {FIXTURE_STATUS_FILTERS.map(({ id, label }) => {
          const isActive = statusFilter === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectStatus(id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {totalFiltered === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          <p>No {statusFilter === "all" ? "" : `${statusFilter} `}matches in this view.</p>
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => selectStatus("all")}
              className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-600"
            >
              Show all matches
            </button>
          )}
        </div>
      ) : (
        <RoundTabs groups={filteredGroups} basePath="/fixtures" countLabel="match">
          {(items) => (
            <div className="grid gap-4">
              {items.map(({ match, prediction, otherPicks, goals }) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={prediction}
                  otherPicks={otherPicks}
                  goals={goals}
                  predictionsDisabled={predictionsDisabled}
                />
              ))}
            </div>
          )}
        </RoundTabs>
      )}
    </div>
  );
}
