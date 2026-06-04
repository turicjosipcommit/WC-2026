import { isAuthDisabled } from "@/lib/auth-config";
import { ensureUserProfile } from "@/lib/ensure-profile";
import { isKnockoutMatch } from "@/lib/match-phase";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function parseRequiredScore(value: unknown) {
  const score = Number(value);
  if (Number.isNaN(score) || score < 0 || score > 20) return null;
  return score;
}

function parseOptionalScore(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return parseRequiredScore(value);
}

function parseOptionalPair(home: unknown, away: unknown) {
  const parsedHome = parseOptionalScore(home);
  const parsedAway = parseOptionalScore(away);

  if (parsedHome === null && parsedAway === null) {
    return { home: null, away: null };
  }

  if (parsedHome === null || parsedAway === null) {
    return { error: "Extra time and penalty scores must include both home and away values" };
  }

  return { home: parsedHome, away: parsedAway };
}

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
  const predHome = parseRequiredScore(body.predHome);
  const predAway = parseRequiredScore(body.predAway);

  if (!matchId || predHome === null || predAway === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const etPair = parseOptionalPair(body.predEtHome, body.predEtAway);
  if ("error" in etPair) {
    return NextResponse.json({ error: etPair.error }, { status: 400 });
  }

  const penPair = parseOptionalPair(body.predPenHome, body.predPenAway);
  if ("error" in penPair) {
    return NextResponse.json({ error: penPair.error }, { status: 400 });
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

  if (!isKnockoutMatch(match) && (etPair.home != null || penPair.home != null)) {
    return NextResponse.json(
      { error: "Extra time and penalty picks are only available for knockout matches" },
      { status: 400 }
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
        pred_et_home: etPair.home,
        pred_et_away: etPair.away,
        pred_pen_home: penPair.home,
        pred_pen_away: penPair.away,
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
