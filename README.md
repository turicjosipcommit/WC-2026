# WC Fantasy 2026

A simple friend-group fantasy app for the FIFA World Cup 2026. Everyone predicts match scores, earns points, and climbs one shared leaderboard.

**Stack:** Next.js · Supabase (Postgres + Auth) · LiveScore API

## Features

- Google login for ~15 friends (single group, no leagues)
- Fixture list synced from LiveScore
- Predictions lock at kickoff
- Auto scoring when results sync
- Leaderboard with exact-score count

### Scoring

Regular time uses 4 / 3 / 2 / 1 / 0 points (exact score down to one team score). Knockout matches can earn **additional** ET and penalty bonuses when your 90′ pick is exact — see the **Scoring** page in the app for full rules and examples.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in **SQL Editor** (in order):

   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_google_profile_names.sql`
   - `supabase/migrations/003_ensure_profiles.sql`
   - `supabase/migrations/004_extra_time_penalties.sql`
   - `supabase/migrations/005_livescore_event_id.sql` (no-op on fresh installs)

3. In **Authentication → URL configuration**, add:
   - Site URL: `http://localhost:3000` (and your production URL later)
   - Redirect URLs: `http://localhost:3000/auth/callback`

4. Enable **Google** sign-in (**Authentication → Providers → Google**):
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `http://localhost:3000` (and your production URL)
   - **Authorized redirect URIs:** `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Paste Client ID into Supabase and into `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Paste Client Secret into Supabase only (the app uses Google Identity Services + ID tokens)

5. Copy API keys from **Project Settings → API**

### 2. Environment

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `CRON_SECRET` (random string)
- `APP_URL` (deployed app URL, used in reminder emails)
- `RESEND_API_KEY`, `REMINDER_FROM_EMAIL` (prediction reminders via Resend)

Optional LiveScore overrides (defaults target WC 2026):

- `LIVESCORE_COMPETITION_ID` (default `734`)
- `LIVESCORE_PROJECT_ID` (default `2`)
- `LIVESCORE_DETAILS_VARIANT` (default `details`; use `details-w` for International Friendlies)
- `LIVESCORE_LOCALE` (default `en`)
- `LIVESCORE_ESD_UTC_OFFSET_HOURS` (default `2`)

For local dev testing with friendlies, put overrides in `.env.development.local`:

```bash
LIVESCORE_COMPETITION_ID=537
LIVESCORE_DETAILS_VARIANT=details-w
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, then load fixtures:

```bash
npm run sync:schedule
```

### 4. Sync results (manual)

```bash
npm run sync:results
```

## Cron / automation

### Supabase Cron (recommended)

Migration `009_sync_results_cron.sql` schedules **`sync-wc-results`** every **minute** using `pg_cron` + `pg_net`. It POSTs to your deployed app:

```http
POST /api/internal/sync-results
x-cron-secret: <CRON_SECRET>
```

The app applies the same gating as before:

1. **Active window** — any match is `live`, or within 5 minutes before kickoff through 3 hours after (covers ET/pens)
2. **Fallback** — full sync at **:00** and **:30** UTC (includes a best-effort schedule refresh)
3. **Idle** — no LiveScore calls between windows

**One-time setup per Supabase project** (production and dev friendlies are separate projects):

1. Apply migrations (`supabase db push` or run `009_sync_results_cron.sql` in the SQL editor).
2. Deploy the Next.js app with `CRON_SECRET` and LiveScore env vars set.
3. Store secrets in **Vault** (Supabase → SQL editor). Edit and run `scripts/setup-sync-cron.sql`:
   - `sync_app_url` — deployed app URL, e.g. `https://your-app.vercel.app` (no trailing slash)
   - `cron_secret` — must match `CRON_SECRET` on that deployment

**Dev friendlies:** use the dev Supabase project, point `sync_app_url` at the dev deployment (with `LIVESCORE_COMPETITION_ID=537`), and use that deployment’s `CRON_SECRET`.

Verify the job: `select jobid, jobname, schedule from cron.job where jobname = 'sync-wc-results';`

Cron run history: Supabase Dashboard → **Integrations → Cron** (or query `cron.job_run_details`).

### Prediction reminders (Resend)

Migration `011_send_reminders_cron.sql` schedules **`send-prediction-reminders`** every **5 minutes**. It POSTs to:

```http
POST /api/internal/send-reminders
x-cron-secret: <CRON_SECRET>
```

For each match kicking off in about **30 minutes** (±3 min window), users without a prognoza receive one email. Sends are deduplicated in `prediction_reminders`.

**Vercel env vars** (in addition to cron/sync vars):

- `RESEND_API_KEY` — from [Resend](https://resend.com)
- `REMINDER_FROM_EMAIL` — verified sender, e.g. `WC Fantasy 2026 <noreply@yourdomain.com>` (test: `onboarding@resend.dev` only delivers to your Resend account email)
- `APP_URL` — e.g. `https://wc-2026-turicjosipcommits-projects.vercel.app`

Optional: `REMINDER_MINUTES_BEFORE` (default `30`), `REMINDER_WINDOW_MINUTES` (default `3`).

Manual test locally:

```bash
npm run send:reminders
REMINDER_FORCE=1 npm run send:reminders   # ignore kickoff window
```

Verify cron job: `select jobid, jobname, schedule from cron.job where jobname = 'send-prediction-reminders';`

### Manual / local

```bash
npm run sync:results:if-needed
```

Friendlies dev project locally:

```bash
npm run sync:friendlies:results:if-needed
```

On your Mac during the tournament (alternative to Supabase Cron):

```bash
# crontab -e
*/5 * * * * cd /Users/josipturic/Projects/wc-fantasy-2026 && /usr/bin/npm run sync:results:if-needed >> /tmp/wc-sync.log 2>&1
```

Protect internal routes with header:

```http
x-cron-secret: YOUR_CRON_SECRET
```

## Project structure

```
src/
  app/                 # Pages + API routes
  components/          # UI
  lib/
    livescore/         # LiveScore client + sync
    supabase/          # Clients
    scoring.ts         # Points calculation
scripts/
  sync-schedule.ts     # Import all WC fixtures
  sync-results.ts      # Update scores + award points
supabase/migrations/   # DB schema
```

## LiveScore API

- Base: `https://prod-cdn-public-api.livescore.com/v1/api/app`
- Competition details: `/competition/{id}/details/{projectId}?locale=en`
- Defaults: competition `734`, project `2` (WC 2026)

LiveScore has **no official public API documentation**. This app uses their public competition endpoint for a private friend league. Use at your own risk.

## Invite friends

Share the deployed URL. Each person signs in with Google — their Google name appears on the leaderboard.

## License

Private friend project.
