"use client";

import { Fragment, useState } from "react";
import { POINTS_BREAKDOWN_LABELS } from "@/lib/leaderboard";
import type { LeaderboardRow } from "@/lib/types";

const MAIN_BREAKDOWN_KEYS = new Set([
  "exact",
  "resultAndOneTeam",
  "resultOnly",
  "oneTeamOnly",
]);

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BreakdownList({ row }: { row: LeaderboardRow }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {POINTS_BREAKDOWN_LABELS.map(({ key, label, points }) => {
        const count = row.points_breakdown[key];
        if (count === 0 && !MAIN_BREAKDOWN_KEYS.has(key)) return null;

        return (
          <li
            key={key}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200"
          >
            <span>
              {label}
              {points != null ? `: ${points} pts` : ""}
            </span>
            <span className="font-semibold text-slate-900">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function LeaderboardTableRow({
  row,
  index,
}: {
  row: LeaderboardRow;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <tr className="border-t border-slate-100">
        <td className="px-4 py-3 text-emerald-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={`${open ? "Hide" : "Show"} points breakdown for ${row.display_name}`}
              className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronIcon open={open} />
            </button>
            <span>{index + 1}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-medium text-slate-900">{row.display_name}</td>
        <td className="px-4 py-3 text-lg font-bold text-emerald-600">
          {row.total_points}
        </td>
        <td className="px-4 py-3 text-slate-600">{row.predictions_count}</td>
        <td className="px-4 py-3 text-slate-600">{row.exact_scores}</td>
      </tr>
      {open && (
        <tr className="border-t border-slate-100 bg-slate-50/60">
          <td colSpan={5} className="px-4 pb-3 pt-1 pl-11">
            <BreakdownList row={row} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
