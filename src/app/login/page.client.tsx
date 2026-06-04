"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error") === "auth";
  const authMessage = searchParams.get("message");

  const [message, setMessage] = useState<string | null>(
    authMessage
      ? decodeURIComponent(authMessage)
      : authError
        ? "Sign-in failed. Please try again."
        : null
  );
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleError = useCallback((errorMessage: string) => {
    setMessage(errorMessage || null);
  }, []);

  const handleGoogleLoading = useCallback((isLoading: boolean) => {
    setGoogleLoading(isLoading);
  }, []);

  const isErrorMessage =
    !!message &&
    (message.includes("Cannot reach Supabase") ||
      message.includes("Missing") ||
      message.toLowerCase().includes("fail") ||
      message.toLowerCase().includes("error") ||
      message.includes("disabled") ||
      message.includes("Unable"));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
          Friend group fantasy
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">WC 2026 Predictions</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with Google to join the leaderboard.
        </p>

        <div className="mt-8">
          <GoogleSignInButton
            disabled={googleLoading}
            onError={handleGoogleError}
            onLoadingChange={handleGoogleLoading}
          />
        </div>

        {message && (
          <p
            className={`mt-4 text-sm ${isErrorMessage ? "text-red-600" : "text-emerald-700"}`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
