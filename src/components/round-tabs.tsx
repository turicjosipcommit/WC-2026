"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  groupKeyToParam,
  paramToGroupKey,
  pickDefaultGroupKey,
  type RoundGroup,
} from "@/lib/fixtures-grouping";
import type { Match } from "@/lib/types";

type RoundTabsProps<T extends { match: Match }> = {
  groups: RoundGroup<T>[];
  basePath: string;
  defaultRoundKey?: string;
  ariaLabel?: string;
  countLabel?: string;
  children: (items: T[]) => ReactNode;
};

export function RoundTabs<T extends { match: Match }>({
  groups,
  basePath,
  defaultRoundKey: defaultRoundKeyProp,
  ariaLabel = "Match rounds",
  countLabel = "pick",
  children,
}: RoundTabsProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultKey = useMemo(
    () => defaultRoundKeyProp ?? pickDefaultGroupKey(groups),
    [defaultRoundKeyProp, groups]
  );

  const selectedKey = useMemo(() => {
    const param = searchParams.get("round");
    if (!param) return defaultKey;

    const key = paramToGroupKey(param);
    const matchingGroup = groups.find((group) => group.key === key);
    if (matchingGroup && matchingGroup.items.length > 0) {
      return key;
    }

    return defaultKey;
  }, [defaultKey, groups, searchParams]);

  const selectedGroup =
    groups.find((group) => group.key === selectedKey) ?? groups[0];

  const selectRound = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("round", groupKeyToParam(key));
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    },
    [basePath, router, searchParams]
  );

  if (!selectedGroup) return null;

  const count = selectedGroup.items.length;
  const countText =
    countLabel === "match"
      ? `${count} match${count === 1 ? "" : "es"}`
      : `${count} pick${count === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="horizontal-scroll-tabs -mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-2"
      >
        {groups.map((group) => {
          const isActive = group.key === selectedKey;

          return (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectRound(group.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
            >
              {group.tabLabel}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {selectedGroup.label}
          </h2>
          <p className="text-sm text-slate-500">{countText}</p>
        </div>

        {children(selectedGroup.items)}
      </div>
    </div>
  );
}
