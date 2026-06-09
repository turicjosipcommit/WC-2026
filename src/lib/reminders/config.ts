const DEFAULT_MINUTES_BEFORE = 30;
const DEFAULT_WINDOW_MINUTES = 3;

export function getReminderMinutesBefore() {
  const parsed = Number.parseInt(process.env.REMINDER_MINUTES_BEFORE ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MINUTES_BEFORE;
}

export function getReminderWindowMinutes() {
  const parsed = Number.parseInt(process.env.REMINDER_WINDOW_MINUTES ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WINDOW_MINUTES;
}

export function getReminderFromEmail() {
  return process.env.REMINDER_FROM_EMAIL?.trim() ?? "";
}

export function getAppUrl() {
  const raw = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  return raw.replace(/\/+$/, "");
}

export function isRemindersConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getReminderFromEmail() && getAppUrl());
}

export function getKickoffReminderWindow(now = new Date()) {
  const minutesBefore = getReminderMinutesBefore();
  const windowMinutes = getReminderWindowMinutes();
  const startMs = now.getTime() + (minutesBefore - windowMinutes) * 60_000;
  const endMs = now.getTime() + (minutesBefore + windowMinutes) * 60_000;

  return {
    minutesBefore,
    windowMinutes,
    windowStart: new Date(startMs),
    windowEnd: new Date(endMs),
  };
}
