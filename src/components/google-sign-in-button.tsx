"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateGoogleNonce, getGoogleClientId } from "@/lib/google-auth";
import { ensureUserProfile } from "@/lib/ensure-profile";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onError: (message: string) => void;
  onLoadingChange: (loading: boolean) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  disabled,
  onError,
  onLoadingChange,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef("");
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !clientId || disabled) {
      return;
    }

    let cancelled = false;

    async function mountButton() {
      if (!buttonRef.current || !window.google) return;

      const [rawNonce, hashedNonce] = await generateGoogleNonce();
      if (cancelled || !buttonRef.current) return;

      nonceRef.current = rawNonce;
      buttonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        nonce: hashedNonce,
        callback: async (response: { credential: string }) => {
          onLoadingChange(true);
          onError("");

          try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: nonceRef.current,
            });

            if (error || !data.user) {
              onError(error?.message ?? "Google prijava nije uspjela.");
              onLoadingChange(false);
              return;
            }

            const profileResult = await ensureUserProfile(supabase, data.user);
            if (!profileResult.ok) {
              onError(profileResult.message);
              onLoadingChange(false);
              return;
            }

            router.push("/");
            router.refresh();
          } catch (cause) {
            onError(
              cause instanceof Error ? cause.message : "Google prijava nije uspjela."
            );
            onLoadingChange(false);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale: "hr",
        width: buttonRef.current.offsetWidth || 360,
      });
    }

    void mountButton();

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, onError, onLoadingChange, router, scriptReady]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Dodajte <code className="text-amber-950">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
        u <code className="text-amber-950">.env.local</code>, zatim ponovno pokrenite
        razvojni poslužitelj.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        async
        onReady={() => setScriptReady(true)}
      />
      <div
        ref={buttonRef}
        className={`flex min-h-[44px] w-full justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}
      />
    </>
  );
}
