#!/usr/bin/env npx tsx
import { config } from "dotenv";

if (!process.env.CI) {
  config({ path: ".env.local" });
  if (process.env.WC_SYNC_ENV !== "production") {
    config({ path: ".env.development.local", override: true });
  }
}

async function main() {
  const { sendPredictionReminders } = await import(
    "../src/lib/reminders/send-prediction-reminders"
  );
  const force = process.env.REMINDER_FORCE === "1";
  const result = await sendPredictionReminders({ force });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
