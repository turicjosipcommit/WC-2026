import { NavMenu, type NavLink } from "@/components/nav-menu";
import { isAuthDisabled } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

const links: NavLink[] = [
  { href: "/", label: "Leaderboard" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/my-picks", label: "My picks" },
  { href: "/scoring", label: "Scoring" },
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
    <header className="relative border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
            WC Fantasy 2026
          </p>
          <p className="truncate text-sm text-slate-600">{displayLabel}</p>
        </div>
        <NavMenu links={links} showSignOut={Boolean(user)} />
      </div>
    </header>
  );
}
