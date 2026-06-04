import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureUserProfile } from "@/lib/ensure-profile";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/")
    ? searchParams.get("next")!
    : "/";

  const oauthError =
    searchParams.get("error_description") ??
    searchParams.get("error_code") ??
    searchParams.get("error");

  if (oauthError && !code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&message=${encodeURIComponent(oauthError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { url, anonKey } = getSupabaseEnv();
  const redirectUrl = `${origin}${next}`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const message =
      error?.message ??
      "Could not complete sign-in. Try again in the same browser.";
    return NextResponse.redirect(
      `${origin}/login?error=auth&message=${encodeURIComponent(message)}`
    );
  }

  await ensureUserProfile(supabase, data.user);

  return response;
}
