export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Expense {
  id: string;
  item: string;
  amount: number;
  category_id: string;
  category?: Category;
  date: string;
  payment_method: PaymentMethod;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category?: Category;
  month: number;
  year: number;
  limit_amount: number;
  created_at: string;
}

export interface MonthlyReport {
  month: number;
  year: number;
  total_expenses: number;
  total_income: number;
  savings: number;
  savings_rate: number;
  by_category: CategorySpending[];
  by_payment_method: PaymentMethodSpending[];
  biggest_expense: Expense | null;
  daily_average: number;
  comparison_to_last_month: number;
  advice: string[];
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  percentage: number;
  count: number;
}

export interface PaymentMethodSpending {
  method: PaymentMethod;
  total: number;
  percentage: number;
  count: number;
}

export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "e_wallet"
  | "bank_transfer"
  | "other";

export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export type TimeRange = "week" | "month" | "year" | "custom";

export interface DailySpending {
  date: string;
  total: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "report" | "reminder" | "alert";
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface ExpenseFormData {
  item: string;
  amount: string;
  category_id: string;
  date: string;
  payment_method: PaymentMethod;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  notes: string;
}

export interface IncomeFormData {
  source: string;
  amount: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  notes: string;
}
