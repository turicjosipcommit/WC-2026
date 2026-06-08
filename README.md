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

### Option A — GitHub Actions (recommended)

Add repo secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (optional, for deployed app ping)

**Production (WC 2026)** — `.github/workflows/sync-results.yml` runs every **5 minutes** (UTC) against the production Supabase project and only syncs when needed:

1. **Active window** — any match is `live`, or within 5 minutes before kickoff through 3 hours after (covers ET/pens)
2. **Fallback** — full sync at **:00** and **:30** each hour (includes a best-effort schedule refresh)
3. **Manual run** — GitHub “Run workflow” always syncs (`SYNC_FORCE=1`)

Between games the job exits immediately with no LiveScore calls.

**Dev friendlies** — `.github/workflows/sync-friendlies-results.yml` uses the same gating but targets the **dev** Supabase project with International Friendlies (`537` / `details-w`). Add repo secrets with these **exact names**:

- `DEV_NEXT_PUBLIC_SUPABASE_URL` — full URL, e.g. `https://algpcgabntzngujtloly.supabase.co` (not just the project ref)
- `DEV_SUPABASE_SERVICE_ROLE_KEY` — dev service role key from Supabase → Settings → API
- `DEV_CRON_SECRET` (optional, if you ping a dev deployment)

Optional repo variable: `DEV_APP_URL` (dev deployment URL for the internal sync ping).

Load the friendlies schedule once on dev:

```bash
npm run sync:friendlies:schedule
```

`npm run sync:results` still forces a full WC sync anytime locally; use `npm run sync:friendlies:results` for friendlies.

### Option B — Manual / local cron

On your Mac during the tournament:

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
