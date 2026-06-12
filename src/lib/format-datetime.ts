const UI_DATE_LOCALE = "hr-HR";
const UI_TIMEZONE = "Europe/Zagreb";

const RELATIVE_DAY_LABELS = {
  yesterday: "jučer",
  today: "danas",
  tomorrow: "sutra",
} as const;

function toDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function calendarDayParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: UI_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")!.value),
    month: Number(parts.find((part) => part.type === "month")!.value),
    day: Number(parts.find((part) => part.type === "day")!.value),
  };
}

function calendarDayDiff(from: Date, to: Date) {
  const a = calendarDayParts(from);
  const b = calendarDayParts(to);
  const fromUtc = Date.UTC(a.year, a.month - 1, a.day);
  const toUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

export function relativeDayLabel(value: string | Date, now = new Date()) {
  const date = toDate(value);
  if (!date) {
    return null;
  }

  const diff = calendarDayDiff(now, date);
  if (diff === 0) return RELATIVE_DAY_LABELS.today;
  if (diff === -1) return RELATIVE_DAY_LABELS.yesterday;
  if (diff === 1) return RELATIVE_DAY_LABELS.tomorrow;
  return null;
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
    timeZone: UI_TIMEZONE,
    ...options,
  });
}

export function formatKickoff(kickoffAt: string, now = new Date()) {
  const date = toDate(kickoffAt);
  if (!date) {
    return "";
  }

  const time = formatDateTime(date, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayLabel = relativeDayLabel(date, now);

  if (dayLabel) {
    return `${dayLabel}, ${time}`;
  }

  return formatDateTime(date, {
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
