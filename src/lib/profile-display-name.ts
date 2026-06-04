export function resolveDisplayName(
  metadata: Record<string, unknown> | undefined,
  email?: string | null
) {
  if (metadata) {
    for (const key of ["full_name", "name", "display_name"]) {
      const value = metadata[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  if (email?.includes("@")) {
    return email.split("@")[0];
  }

  return null;
}
