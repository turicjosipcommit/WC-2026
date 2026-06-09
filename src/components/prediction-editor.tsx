"use client";

import { useState } from "react";
import { SAVED_MESSAGE } from "@/lib/i18n";
import { isKnockoutMatch } from "@/lib/match-phase";
import type { Match, Prediction } from "@/lib/types";

function ScoreInputGroup({
  label,
  shortLabel,
  home,
  away,
  onHomeChange,
  onAwayChange,
  optional = false,
}: {
  label: string;
  shortLabel?: string;
  home: string;
  away: string;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="min-w-[4.75rem] shrink-0 sm:min-w-[5.5rem]">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
        {optional ? (
          <span className="hidden font-normal normal-case text-slate-400 sm:inline">
            {" "}
            (neobavezno)
          </span>
        ) : null}
      </p>
      <div className="flex gap-1.5 sm:gap-2">
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => onHomeChange(e.target.value)}
          aria-label={`${label} domaćin`}
          placeholder="D"
          className="w-12 rounded-lg border border-slate-300 bg-white px-1.5 py-2 text-center text-slate-900 sm:w-16 sm:px-3"
        />
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => onAwayChange(e.target.value)}
          aria-label={`${label} gost`}
          placeholder="G"
          className="w-12 rounded-lg border border-slate-300 bg-white px-1.5 py-2 text-center text-slate-900 sm:w-16 sm:px-3"
        />
      </div>
    </div>
  );
}

function optionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

type PredictionEditorProps = {
  match: Match;
  prediction?: Prediction | null;
  onSaved?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  saveLabel?: string;
};

export function PredictionEditor({
  match,
  prediction,
  onSaved,
  onCancel,
  showCancel = false,
  saveLabel = "Spremi prognozu",
}: PredictionEditorProps) {
  const knockout = isKnockoutMatch(match);
  const [home, setHome] = useState(String(prediction?.pred_home ?? ""));
  const [away, setAway] = useState(String(prediction?.pred_away ?? ""));
  const [etHome, setEtHome] = useState(String(prediction?.pred_et_home ?? ""));
  const [etAway, setEtAway] = useState(String(prediction?.pred_et_away ?? ""));
  const [penHome, setPenHome] = useState(String(prediction?.pred_pen_home ?? ""));
  const [penAway, setPenAway] = useState(String(prediction?.pred_pen_away ?? ""));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePrediction() {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        predHome: Number(home),
        predAway: Number(away),
        predEtHome: optionalNumber(etHome),
        predEtAway: optionalNumber(etAway),
        predPenHome: optionalNumber(penHome),
        predPenAway: optionalNumber(penAway),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      const errorText = data.error ?? "Nije moguće spremiti prognozu";
      setMessage(
        errorText.includes("predictions_user_id_fkey")
          ? "Nedostaje vaš profil igrača. Odjavite se, prijavite ponovno i pokušajte opet."
          : errorText
      );
      return;
    }

    setMessage(SAVED_MESSAGE);
    onSaved?.();
  }

  return (
    <div className="space-y-1">
      <div
        className={
          knockout
            ? "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            : "flex flex-wrap items-end gap-3"
        }
      >
        <div
          className={
            knockout
              ? "flex flex-wrap items-end gap-x-5 gap-y-3 sm:gap-x-4"
              : "contents"
          }
        >
          <ScoreInputGroup
            label="Regularno vrijeme"
            shortLabel="90′"
            home={home}
            away={away}
            onHomeChange={setHome}
            onAwayChange={setAway}
          />
          {knockout && (
            <>
              <ScoreInputGroup
                label="Produžetak"
                shortLabel="Prod."
                home={etHome}
                away={etAway}
                onHomeChange={setEtHome}
                onAwayChange={setEtAway}
                optional
              />
              <ScoreInputGroup
                label="Penali"
                shortLabel="Pen."
                home={penHome}
                away={penAway}
                onHomeChange={setPenHome}
                onAwayChange={setPenAway}
                optional
              />
            </>
          )}
        </div>

        <div
          className={
            knockout
              ? "flex w-full shrink-0 gap-2 sm:ml-auto sm:w-auto"
              : "flex shrink-0 gap-2"
          }
        >
          <button
            type="button"
            disabled={saving || home === "" || away === ""}
            onClick={savePrediction}
            className={
              knockout
                ? "flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 sm:flex-none"
                : "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            }
          >
            {saving ? "Spremanje…" : saveLabel}
          </button>
          {showCancel && onCancel && (
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Odustani
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message === SAVED_MESSAGE ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
