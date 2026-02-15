import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { CURRENCY_SYMBOL } from "./constants";
import { PaymentMethod, TimeRange } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "dd/MM/yy");
}

export function getDateRange(range: TimeRange, refDate: Date = new Date()): { start: Date; end: Date } {
  switch (range) {
    case "week":
      return { start: startOfWeek(refDate, { weekStartsOn: 1 }), end: endOfWeek(refDate, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    case "year":
      return { start: startOfYear(refDate), end: endOfYear(refDate) };
    default:
      return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash: "Cash",
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    e_wallet: "E-Wallet",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  return labels[method];
}

export function generateAdvice(
  totalExpenses: number,
  totalIncome: number,
  categorySpending: { category_name: string; total: number; percentage: number }[],
  lastMonthTotal: number
): string[] {
  const advice: string[] = [];
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  if (savingsRate < 0) {
    advice.push("You are spending more than you earn this month. Consider reviewing your expenses and cutting non-essential spending.");
  } else if (savingsRate < 10) {
    advice.push("Your savings rate is below 10%. Financial experts recommend saving at least 20% of your income.");
  } else if (savingsRate >= 20) {
    advice.push("Great job! You are saving more than 20% of your income this month.");
  }

  if (lastMonthTotal > 0 && totalExpenses > lastMonthTotal * 1.2) {
    const increase = ((totalExpenses - lastMonthTotal) / lastMonthTotal * 100).toFixed(0);
    advice.push(`Your spending increased by ${increase}% compared to last month. Review what changed.`);
  } else if (lastMonthTotal > 0 && totalExpenses < lastMonthTotal * 0.8) {
    advice.push("You spent less than last month. Keep up the good habit!");
  }

  const topCategory = categorySpending[0];
  if (topCategory && topCategory.percentage > 40) {
    advice.push(`${topCategory.category_name} takes up ${topCategory.percentage.toFixed(0)}% of your spending. Consider setting a budget limit for this category.`);
  }

  if (categorySpending.length > 0) {
    const foodCategory = categorySpending.find(c => c.category_name.toLowerCase().includes("food"));
    if (foodCategory && foodCategory.percentage > 30) {
      advice.push("Food expenses are over 30% of your total spending. Consider meal planning or cooking at home more often.");
    }
  }

  if (advice.length === 0) {
    advice.push("Your spending looks balanced this month. Keep tracking your expenses consistently!");
  }

  return advice;
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}
