import { Resend } from "resend";
import { formatKickoff } from "@/lib/format-datetime";
import { getAppUrl, getReminderFromEmail } from "@/lib/reminders/config";

export interface ReminderEmailInput {
  to: string;
  displayName: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  matchId: string;
  userId: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildReminderEmailContent(input: ReminderEmailInput) {
  const appUrl = getAppUrl();
  const fixturesUrl = `${appUrl}/fixtures`;
  const kickoffLabel = formatKickoff(input.kickoffAt);
  const greetingName = escapeHtml(input.displayName);
  const homeTeam = escapeHtml(input.homeTeam);
  const awayTeam = escapeHtml(input.awayTeam);

  const subject = `Podsjetnik: unesite prognozu za ${input.homeTeam} – ${input.awayTeam}`;

  const text = [
    `Bok ${input.displayName},`,
    "",
    `Utakmica ${input.homeTeam} – ${input.awayTeam} počinje oko ${kickoffLabel}, a još nemate unesenu prognozu.`,
    "",
    `Unesite prognozu ovdje: ${fixturesUrl}`,
    "",
    "WC Fantasy 2026",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="hr">
  <body style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.5;">
    <p>Bok ${greetingName},</p>
    <p>
      Utakmica <strong>${homeTeam} – ${awayTeam}</strong> počinje oko
      <strong>${escapeHtml(kickoffLabel)}</strong>, a još nemate unesenu prognozu.
    </p>
    <p>
      <a href="${fixturesUrl}" style="color: #059669; font-weight: 600;">
        Unesite prognozu na stranici Utakmice
      </a>
    </p>
    <p style="color: #64748b; font-size: 14px;">WC Fantasy 2026</p>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendReminderEmail(input: ReminderEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getReminderFromEmail();

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or REMINDER_FROM_EMAIL");
  }

  const resend = new Resend(apiKey);
  const content = buildReminderEmailContent(input);

  const { data, error } = await resend.emails.send(
    {
      from,
      to: [input.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    },
    {
      idempotencyKey: `prediction-reminder/${input.matchId}/${input.userId}`,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
