import { isAuthDisabled } from "@/lib/auth-config";
import { ensureUserProfile } from "@/lib/ensure-profile";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (isAuthDisabled()) {
    return NextResponse.json({ predictions: [] });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ predictions: data });
}

export async function POST(request: Request) {
  if (isAuthDisabled()) {
    return NextResponse.json(
      { error: "Login is disabled. Predictions cannot be saved right now." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const matchId = body.matchId as string | undefined;
  const predHome = Number(body.predHome);
  const predAway = Number(body.predAway);

  if (!matchId || Number.isNaN(predHome) || Number.isNaN(predAway)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (predHome < 0 || predAway < 0 || predHome > 20 || predAway > 20) {
    return NextResponse.json({ error: "Invalid score range" }, { status: 400 });
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (new Date(match.kickoff_at) <= new Date()) {
    return NextResponse.json(
      { error: "Predictions are locked after kickoff" },
      { status: 403 }
    );
  }

  const profileResult = await ensureUserProfile(supabase, user);
  if (!profileResult.ok) {
    return NextResponse.json({ error: profileResult.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        pred_home: predHome,
        pred_away: predAway,
      },
      { onConflict: "user_id,match_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ prediction: data });
}
