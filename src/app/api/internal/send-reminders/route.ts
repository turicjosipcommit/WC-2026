import { NextResponse } from "next/server";
import { sendPredictionReminders } from "@/lib/reminders/send-prediction-reminders";

function authorize(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force =
      searchParams.get("force") === "1" ||
      request.headers.get("x-reminder-force") === "1";

    const result = await sendPredictionReminders({ force });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reminder send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
