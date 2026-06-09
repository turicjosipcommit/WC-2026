import { sendReminderEmail } from "@/lib/reminders/email";
import {
  getKickoffReminderWindow,
  isRemindersConfigured,
} from "@/lib/reminders/config";
import { createAdminClient } from "@/lib/supabase/admin";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
};

async function loadUserEmails(admin: ReturnType<typeof createAdminClient>) {
  const emails = new Map<string, string>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (user.email) {
        emails.set(user.id, user.email);
      }
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return emails;
}

export async function sendPredictionReminders(options?: { force?: boolean }) {
  if (!isRemindersConfigured()) {
    return {
      ok: true as const,
      skipped: true,
      reason: "not_configured" as const,
      sent: 0,
      failed: 0,
      matches: 0,
      candidates: 0,
    };
  }

  const admin = createAdminClient();
  const { windowStart, windowEnd, minutesBefore, windowMinutes } =
    getKickoffReminderWindow();

  let matchesQuery = admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .in("status", ["scheduled", "postponed"])
    .gt("kickoff_at", new Date().toISOString());

  if (!options?.force) {
    matchesQuery = matchesQuery
      .gte("kickoff_at", windowStart.toISOString())
      .lte("kickoff_at", windowEnd.toISOString());
  }

  const { data: matches, error: matchesError } = await matchesQuery;
  if (matchesError) {
    throw matchesError;
  }

  const matchRows = (matches ?? []) as MatchRow[];
  if (matchRows.length === 0) {
    return {
      ok: true as const,
      skipped: true,
      reason: "no_matches" as const,
      sent: 0,
      failed: 0,
      matches: 0,
      candidates: 0,
      minutesBefore,
      windowMinutes,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    };
  }

  const matchIds = matchRows.map((match) => match.id);

  const [
    { data: profiles, error: profilesError },
    { data: predictions, error: predictionsError },
    { data: reminders, error: remindersError },
    userEmails,
  ] = await Promise.all([
    admin.from("profiles").select("id, display_name"),
    admin.from("predictions").select("user_id, match_id").in("match_id", matchIds),
    admin.from("prediction_reminders").select("user_id, match_id").in("match_id", matchIds),
    loadUserEmails(admin),
  ]);

  if (profilesError) throw profilesError;
  if (predictionsError) throw predictionsError;
  if (remindersError) throw remindersError;

  const profileRows = (profiles ?? []) as ProfileRow[];
  const predicted = new Set(
    (predictions ?? []).map((row) => `${row.user_id}:${row.match_id}`)
  );
  const alreadySent = new Set(
    (reminders ?? []).map((row) => `${row.user_id}:${row.match_id}`)
  );

  const candidates: Array<{
    userId: string;
    match: MatchRow;
    email: string;
    displayName: string;
  }> = [];

  for (const profile of profileRows) {
    const email = userEmails.get(profile.id);
    if (!email) continue;

    for (const match of matchRows) {
      const key = `${profile.id}:${match.id}`;
      if (predicted.has(key) || alreadySent.has(key)) continue;

      candidates.push({
        userId: profile.id,
        match,
        email,
        displayName: profile.display_name,
      });
    }
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      await sendReminderEmail({
        to: candidate.email,
        displayName: candidate.displayName,
        homeTeam: candidate.match.home_team,
        awayTeam: candidate.match.away_team,
        kickoffAt: candidate.match.kickoff_at,
        matchId: candidate.match.id,
        userId: candidate.userId,
      });

      const { error: insertError } = await admin.from("prediction_reminders").insert({
        user_id: candidate.userId,
        match_id: candidate.match.id,
      });

      if (insertError) {
        throw insertError;
      }

      sent += 1;
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message : "Failed to send reminder email";
      errors.push(`${candidate.userId}:${candidate.match.id} — ${message}`);
      console.error("Prediction reminder failed:", message);
    }
  }

  return {
    ok: true as const,
    skipped: false as const,
    sent,
    failed,
    matches: matchRows.length,
    candidates: candidates.length,
    minutesBefore,
    windowMinutes,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  };
}
