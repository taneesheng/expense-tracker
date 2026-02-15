import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateAdvice } from "@/lib/utils";
import { CategorySpending, PaymentMethodSpending, Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);

  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  // Fetch expenses for the month
  const { data: expenses, error: expError } = await supabase
    .from("expenses")
    .select("*, category:categories(*)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("amount", { ascending: false });

  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }

  // Fetch income for the month
  const { data: incomeData, error: incError } = await supabase
    .from("income")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);

  if (incError) {
    return NextResponse.json({ error: incError.message }, { status: 500 });
  }

  // Fetch last month's expenses for comparison
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastYear = month === 1 ? year - 1 : year;
  const lastStartDate = `${lastYear}-${String(lastMonth).padStart(2, "0")}-01`;
  const lastEndDate = new Date(lastYear, lastMonth, 0).toISOString().split("T")[0];

  const { data: lastMonthExpenses } = await supabase
    .from("expenses")
    .select("amount")
    .gte("date", lastStartDate)
    .lte("date", lastEndDate);

  const totalExpenses = (expenses || []).reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
  const totalIncome = (incomeData || []).reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0);
  const lastMonthTotal = (lastMonthExpenses || []).reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryMap = new Map<string, CategorySpending>();
  for (const expense of expenses || []) {
    const cat = expense.category;
    const key = cat?.id || "uncategorized";
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += Number(expense.amount);
      existing.count += 1;
    } else {
      categoryMap.set(key, {
        category_id: key,
        category_name: cat?.name || "Uncategorized",
        category_color: cat?.color || "#607D8B",
        category_icon: cat?.icon || "more-horizontal",
        total: Number(expense.amount),
        percentage: 0,
        count: 1,
      });
    }
  }

  const byCategory: CategorySpending[] = Array.from(categoryMap.values())
    .map((c) => ({ ...c, percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  // Payment method breakdown
  const methodMap = new Map<string, PaymentMethodSpending>();
  for (const expense of expenses || []) {
    const method = expense.payment_method;
    const existing = methodMap.get(method);
    if (existing) {
      existing.total += Number(expense.amount);
      existing.count += 1;
    } else {
      methodMap.set(method, {
        method: method,
        total: Number(expense.amount),
        percentage: 0,
        count: 1,
      });
    }
  }

  const byPaymentMethod: PaymentMethodSpending[] = Array.from(methodMap.values())
    .map((m) => ({ ...m, percentage: totalExpenses > 0 ? (m.total / totalExpenses) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const daysElapsed = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate()
    : daysInMonth;

  const biggestExpense: Expense | null = expenses && expenses.length > 0 ? expenses[0] : null;

  const advice = generateAdvice(totalExpenses, totalIncome, byCategory, lastMonthTotal);

  const report = {
    month,
    year,
    total_expenses: totalExpenses,
    total_income: totalIncome,
    savings: totalIncome - totalExpenses,
    savings_rate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    by_category: byCategory,
    by_payment_method: byPaymentMethod,
    biggest_expense: biggestExpense,
    daily_average: daysElapsed > 0 ? totalExpenses / daysElapsed : 0,
    comparison_to_last_month: lastMonthTotal > 0 ? ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100 : 0,
    advice,
  };

  return NextResponse.json(report);
}
