import Link from "next/link";
import { isAuthDisabled } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/my-picks", label: "My picks" },
];

export async function Nav() {
  const authDisabled = isAuthDisabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !authDisabled) return null;

  const profile =
    user &&
    (
      await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
    ).data;

  const displayLabel = authDisabled && !user
    ? "Guest (login disabled)"
    : (profile?.display_name ?? user?.email ?? "Guest");

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
            WC Fantasy 2026
          </p>
          <p className="text-sm text-slate-600">{displayLabel}</p>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              {link.label}
            </Link>
          ))}
          {user && <SignOutButton />}
        </nav>
      </div>
    </header>
  );
}
