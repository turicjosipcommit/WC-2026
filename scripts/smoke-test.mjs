import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

const routes = [
  { path: "/login", expectText: "WC 2026 Predictions", auth: false },
  { path: "/", expectRedirect: "/login", auth: false },
  { path: "/fixtures", expectRedirect: "/login", auth: false },
  { path: "/my-picks", expectRedirect: "/login", auth: false },
];

const results = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

page.on("console", (msg) => {
  if (msg.type() === "error") {
    consoleErrors.push({ url: page.url(), text: msg.text() });
  }
});

page.on("pageerror", (err) => {
  pageErrors.push({ url: page.url(), text: err.message });
});

page.on("requestfailed", (req) => {
  failedRequests.push({
    url: page.url(),
    resource: req.url(),
    failure: req.failure()?.errorText ?? "unknown",
  });
});

for (const route of routes) {
  const entry = { path: route.path, ok: true, notes: [] };

  try {
    const response = await page.goto(`${BASE}${route.path}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    entry.status = response?.status() ?? 0;
    const finalUrl = page.url();

    if (route.expectRedirect) {
      if (!finalUrl.includes(route.expectRedirect)) {
        entry.ok = false;
        entry.notes.push(`Expected redirect to ${route.expectRedirect}, got ${finalUrl}`);
      }
    }

    if (route.expectText) {
      const content = await page.content();
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

// API smoke (cron-protected should 401 without secret)
for (const api of ["/api/matches", "/api/leaderboard", "/api/internal/sync-results"]) {
  const entry = { path: api, ok: true, notes: [] };
  try {
    const response = await page.request.get(`${BASE}${api}`);
    entry.status = response.status();
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

await browser.close();

const report = {
  base: BASE,
  routes: results,
  consoleErrors,
  pageErrors,
  failedRequests: failedRequests.filter(
    (r) => !r.resource.includes("favicon") && !r.resource.includes("_next/webpack-hmr")
  ),
  passed: results.every((r) => r.ok) && pageErrors.length === 0,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
