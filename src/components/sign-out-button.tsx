"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SignOutButtonProps = {
  className?: string;
  onSignedOut?: () => void;
};

export function SignOutButton({ className = "", onSignedOut }: SignOutButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        onSignedOut?.();
        router.push("/login");
        router.refresh();
      }}
      className={`rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 ${className}`}
    >
      Odjava
    </button>
  );
}
