const UI_DATE_LOCALE = "hr-HR";

function toDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions
) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return date.toLocaleString(UI_DATE_LOCALE, {
    hour12: false,
    ...options,
  });
}

export function formatKickoff(kickoffAt: string) {
  return formatDateTime(kickoffAt, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSyncedAt(iso: string) {
  return formatDateTime(iso, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
