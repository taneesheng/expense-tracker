import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateAdvice } from "@/lib/utils";
import { getMonthName } from "@/lib/utils";

export const dynamic = "force-dynamic";

// This endpoint is called by Vercel Cron on the 1st of each month
// It generates a report for the previous month and creates a notification
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const startDate = `${lastYear}-${String(lastMonth).padStart(2, "0")}-01`;
  const endDate = new Date(lastYear, lastMonth, 0).toISOString().split("T")[0];

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, category:categories(*)")
    .gte("date", startDate)
    .lte("date", endDate);

  // Fetch income
  const { data: incomeData } = await supabase
    .from("income")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);

  const totalExpenses = (expenses || []).reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
  const totalIncome = (incomeData || []).reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0);
  const savings = totalIncome - totalExpenses;

  // Category breakdown for advice
  const categoryMap = new Map<string, { category_name: string; total: number; percentage: number }>();
  for (const expense of expenses || []) {
    const cat = expense.category;
    const key = cat?.name || "Uncategorized";
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += Number(expense.amount);
    } else {
      categoryMap.set(key, { category_name: key, total: Number(expense.amount), percentage: 0 });
    }
  }
  const byCategory = Array.from(categoryMap.values())
    .map((c) => ({ ...c, percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  const advice = generateAdvice(totalExpenses, totalIncome, byCategory, 0);
  const monthName = getMonthName(lastMonth);

  // Create notification
  const { error } = await supabase.from("notifications").insert({
    title: `${monthName} ${lastYear} Monthly Report`,
    message: `Total spending: RM ${totalExpenses.toFixed(2)} | Income: RM ${totalIncome.toFixed(2)} | ${savings >= 0 ? "Saved" : "Overspent"}: RM ${Math.abs(savings).toFixed(2)}`,
    type: "report",
    is_read: false,
    data: {
      month: lastMonth,
      year: lastYear,
      total_expenses: totalExpenses,
      total_income: totalIncome,
      savings,
      top_category: byCategory[0]?.category_name || "N/A",
      advice: advice[0] || "",
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    month: monthName,
    year: lastYear,
    total_expenses: totalExpenses,
    total_income: totalIncome,
  });
}
