"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-lg px-3 py-2 text-sm text-emerald-200/70 transition hover:bg-emerald-900/60 hover:text-emerald-50"
    >
      Sign out
    </button>
  );
}
