import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/my-picks", label: "My picks" },
];

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <header className="border-b border-emerald-900/40 bg-emerald-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            WC Fantasy 2026
          </p>
          <p className="text-sm text-emerald-100/80">
            {profile?.display_name ?? user.email}
          </p>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-emerald-50/90 transition hover:bg-emerald-900/60"
            >
              {link.label}
            </Link>
          ))}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
