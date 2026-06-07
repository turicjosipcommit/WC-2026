"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SyncDataButtonProps = {
  className?: string;
  lastSyncedAt?: string | null;
};

function formatLastSyncedAt(iso: string | null) {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SyncDataButton({ className = "", lastSyncedAt = null }: SyncDataButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(lastSyncedAt);

  useEffect(() => {
    setSyncedAt(lastSyncedAt);
  }, [lastSyncedAt]);

  const lastSyncedLabel = formatLastSyncedAt(syncedAt);

  async function syncData() {
    setSyncing(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        lastSyncedAt?: string | null;
        schedule?: { upserted?: number };
        results?: { updated?: number; scoredPredictions?: number };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
      }

      if (data.lastSyncedAt) {
        setSyncedAt(data.lastSyncedAt);
      }

      const upserted = data.schedule?.upserted ?? 0;
      const updated = data.results?.updated ?? 0;
      const scored = data.results?.scoredPredictions ?? 0;

      setMessage(
        upserted > 0 || updated > 0 || scored > 0
          ? `Synced ${upserted} fixtures, ${updated} results${scored > 0 ? `, ${scored} scored` : ""}.`
          : "Already up to date."
      );
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => void syncData()}
        disabled={syncing}
        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
      >
        {syncing ? "Syncing…" : "Sync data"}
      </button>
      {lastSyncedLabel && (
        <p className="text-right text-xs text-slate-500">Last synced {lastSyncedLabel}</p>
      )}
      {message && (
        <p
          role="status"
          className={`max-w-xs text-right text-xs ${isError ? "text-red-600" : "text-emerald-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
