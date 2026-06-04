const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseEnv() {
  if (!url?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.local.example to .env.local and add your Supabase project URL."
    );
  }

  if (!anonKey?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add the anon or publishable key from Supabase → Project Settings → API."
    );
  }

  return { url, anonKey };
}

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }
  return String(cause);
}

function isNetworkError(message: string, cause: unknown): boolean {
  if (/ENOTFOUND|Could not resolve host|Failed to fetch|fetch failed/i.test(message)) {
    return true;
  }

  if (cause instanceof Error && cause.cause) {
    return isNetworkError(getErrorMessage(cause.cause), cause.cause);
  }

  return false;
}

export function formatSupabaseFetchError(cause: unknown): string {
  const message = getErrorMessage(cause);

  if (isNetworkError(message, cause)) {
    return `Cannot reach Supabase at ${url}. Open Supabase → Project Settings → API and copy the exact Project URL into NEXT_PUBLIC_SUPABASE_URL in .env.local.`;
  }

  return message || "Something went wrong while contacting Supabase.";
}
