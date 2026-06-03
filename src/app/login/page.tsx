"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: displayName ? { display_name: displayName } : undefined,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email for the magic link.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-emerald-900/50 bg-emerald-950/60 p-8 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">
          Friend group fantasy
        </p>
        <h1 className="mt-2 text-3xl font-bold text-emerald-50">WC 2026 Predictions</h1>
        <p className="mt-2 text-sm text-emerald-200/75">
          Sign in with your email. First time? Add your display name for the
          leaderboard.
        </p>

        <form onSubmit={sendMagicLink} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm text-emerald-100/85">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Josip"
              className="rounded-xl border border-emerald-800 bg-emerald-950 px-4 py-3 text-emerald-50"
            />
          </label>
          <label className="grid gap-2 text-sm text-emerald-100/85">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-emerald-800 bg-emerald-950 px-4 py-3 text-emerald-50"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-500 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-emerald-200">{message}</p>}
      </div>
    </main>
  );
}
