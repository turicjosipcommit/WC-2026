"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncDataButtonProps = {
  className?: string;
};

export function SyncDataButton({ className = "" }: SyncDataButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function syncData() {
    setSyncing(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        schedule?: { upserted?: number };
        results?: { updated?: number; scoredPredictions?: number };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
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
