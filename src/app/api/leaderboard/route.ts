import { NextResponse } from "next/server";
import { buildLeaderboardRows } from "@/lib/leaderboard";
import { getDataClient } from "@/lib/supabase/data";

export async function GET() {
  const supabase = await getDataClient();

  const [{ data: profiles, error: profilesError }, { data: predictions, error: predictionsError }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("predictions").select("user_id, points_awarded, et_points_awarded, pen_points_awarded"),
    ]);

  if (profilesError || predictionsError) {
    return NextResponse.json(
      { error: profilesError?.message ?? predictionsError?.message },
      { status: 500 }
    );
  }

  const leaderboard = buildLeaderboardRows(profiles ?? [], predictions ?? []);

  return NextResponse.json({ leaderboard });
}
