import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const categoryId = searchParams.get("category_id");
  const paymentMethod = searchParams.get("payment_method");
  const isRecurring = searchParams.get("is_recurring");
  const search = searchParams.get("search");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  let query = supabase
    .from("expenses")
    .select("*, category:categories(*)")
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);
  if (isRecurring === "true") query = query.eq("is_recurring", true);
  if (search) query = query.ilike("item", `%${search}%`);
  if (limit) query = query.limit(parseInt(limit));
  if (offset) query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || "50") - 1);

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
    .from("expenses")
    .insert({
      item: body.item,
      amount: parseFloat(body.amount),
      category_id: body.category_id,
      date: body.date,
      payment_method: body.payment_method || "cash",
      is_recurring: body.is_recurring || false,
      recurring_frequency: body.recurring_frequency || null,
      notes: body.notes || null,
      receipt_url: body.receipt_url || null,
    })
    .select("*, category:categories(*)")
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
    .from("expenses")
    .update({
      item: body.item,
      amount: parseFloat(body.amount),
      category_id: body.category_id,
      date: body.date,
      payment_method: body.payment_method,
      is_recurring: body.is_recurring,
      recurring_frequency: body.recurring_frequency || null,
      notes: body.notes || null,
      receipt_url: body.receipt_url || null,
    })
    .eq("id", body.id)
    .select("*, category:categories(*)")
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

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
