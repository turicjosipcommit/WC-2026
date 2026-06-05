const BASE = process.env.APP_URL ?? "http://localhost:3000";

const routes = [
  { path: "/login", expectText: "WC 2026 Predictions", auth: false },
  { path: "/", expectRedirect: "/login", auth: false },
  { path: "/fixtures", expectRedirect: "/login", auth: false },
  { path: "/my-picks", expectRedirect: "/login", auth: false },
];

const results = [];

for (const route of routes) {
  const entry = { path: route.path, ok: true, notes: [] };

  try {
    const response = await fetch(`${BASE}${route.path}`, { redirect: "manual" });
    entry.status = response.status;

    if (route.expectRedirect) {
      const location = response.headers.get("location") ?? "";
      if (!location.includes(route.expectRedirect)) {
        entry.ok = false;
        entry.notes.push(
          `Expected redirect to ${route.expectRedirect}, got ${location || response.status}`
        );
      }
    }

    if (route.expectText) {
      const content = await response.text();
      if (!content.includes(route.expectText)) {
        entry.ok = false;
        entry.notes.push(`Missing expected text: ${route.expectText}`);
      }
    }

    if (entry.status >= 500) {
      entry.ok = false;
      entry.notes.push(`HTTP ${entry.status}`);
    }
  } catch (error) {
    entry.ok = false;
    entry.notes.push(error instanceof Error ? error.message : String(error));
  }

  results.push(entry);
}

for (const api of ["/api/matches", "/api/leaderboard", "/api/internal/sync-results"]) {
  const entry = { path: api, ok: true, notes: [] };
  try {
    const response = await fetch(`${BASE}${api}`);
    entry.status = response.status;
    if (api.startsWith("/api/internal") && entry.status !== 401) {
      entry.ok = false;
      entry.notes.push(`Expected 401 without cron secret, got ${entry.status}`);
    }
    if (!api.includes("internal") && entry.status >= 500) {
      entry.ok = false;
      entry.notes.push(`HTTP ${entry.status}`);
    }
  } catch (error) {
    entry.ok = false;
    entry.notes.push(error instanceof Error ? error.message : String(error));
  }
  results.push(entry);
}

const report = {
  base: BASE,
  routes: results,
  passed: results.every((r) => r.ok),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
