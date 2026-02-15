import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const isRecurring = searchParams.get("is_recurring");
  const limit = searchParams.get("limit");

  let query = supabase
    .from("income")
    .select("*")
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (isRecurring === "true") query = query.eq("is_recurring", true);
  if (limit) query = query.limit(parseInt(limit));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("income")
    .insert({
      source: body.source,
      amount: parseFloat(body.amount),
      date: body.date,
      is_recurring: body.is_recurring || false,
      recurring_frequency: body.recurring_frequency || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = getServiceSupabase();
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("income")
    .update({
      source: body.source,
      amount: parseFloat(body.amount),
      date: body.date,
      is_recurring: body.is_recurring,
      recurring_frequency: body.recurring_frequency || null,
      notes: body.notes || null,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("income").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
