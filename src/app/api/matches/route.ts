import { NextResponse } from "next/server";
import { getDataClient } from "@/lib/supabase/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get("round");
  const status = searchParams.get("status");

  const supabase = await getDataClient();
  let query = supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  if (round) {
    query = query.eq("round_number", Number(round));
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ matches: data });
}
