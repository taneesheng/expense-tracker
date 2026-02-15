"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Expense, Income, MonthlyReport, Category, ExpenseFormData } from "@/lib/types";
import { PAYMENT_METHODS, RECURRING_FREQUENCIES } from "@/lib/constants";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function DashboardPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchData = useCallback(async () => {
    try {
      const [reportRes, expensesRes, categoriesRes] = await Promise.all([
        fetch(`/api/reports?month=${month}&year=${year}`),
        fetch(`/api/expenses?limit=5`),
        fetch(`/api/categories`),
      ]);
      const [reportData, expensesData, categoriesData] = await Promise.all([
        reportRes.json(),
        expensesRes.json(),
        categoriesRes.json(),
      ]);
      setReport(reportData);
      if (Array.isArray(expensesData)) setRecentExpenses(expensesData);
      if (Array.isArray(categoriesData)) setCategories(categoriesData);
    } catch {
      // silently handle errors
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} Overview
          </p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <SummaryCard
          title="Total Spending"
          value={formatCurrency(report?.total_expenses || 0)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="expense"
          change={report?.comparison_to_last_month || 0}
        />
        <SummaryCard
          title="Total Income"
          value={formatCurrency(report?.total_income || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="income"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(report?.savings || 0)}
          icon={<PiggyBank className="w-5 h-5" />}
          color={report?.savings && report.savings >= 0 ? "income" : "expense"}
        />
        <SummaryCard
          title="Daily Average"
          value={formatCurrency(report?.daily_average || 0)}
          icon={<Wallet className="w-5 h-5" />}
          color="info"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-1 card p-5">
          <h3 className="font-semibold text-text-primary mb-4">By Category</h3>
          {report?.by_category && report.by_category.length > 0 ? (
            <div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.by_category.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="category_name"
                    >
                      {report.by_category.slice(0, 6).map((entry, index) => (
                        <Cell key={index} fill={entry.category_color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {report.by_category.slice(0, 5).map((cat) => (
                  <div key={cat.category_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.category_color }}
                      />
                      <span className="text-text-secondary truncate max-w-[120px]">
                        {cat.category_name}
                      </span>
                    </div>
                    <span className="font-medium">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">
              No expenses this month
            </p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">
              Recent Expenses
            </h3>
            <Link
              href="/expenses"
              className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        backgroundColor:
                          expense.category?.color || "#607D8B",
                      }}
                    >
                      {expense.item.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {expense.item}
                      </p>
                      <p className="text-xs text-text-muted">
                        {expense.category?.name || "Uncategorized"} &middot;{" "}
                        {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-expense">
                    -{formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">
              No expenses recorded yet. Start by adding your first expense!
            </p>
          )}
        </div>
      </div>

      {/* Advice Section */}
      {report?.advice && report.advice.length > 0 && (
        <div className="card p-5 bg-primary-50/50 border-primary-200">
          <h3 className="font-semibold text-primary-800 mb-2">
            Financial Tips
          </h3>
          <ul className="space-y-1.5">
            {report.advice.map((tip, i) => (
              <li key={i} className="text-sm text-primary-700 flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">&#x2022;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddExpense
          categories={categories}
          onClose={() => setShowQuickAdd(false)}
          onSaved={() => {
            setShowQuickAdd(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  change,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  change?: number;
}) {
  const colorMap: Record<string, string> = {
    expense: "bg-red-50 text-expense",
    income: "bg-emerald-50 text-income",
    info: "bg-blue-50 text-info",
    warning: "bg-amber-50 text-warning",
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.info}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl lg:text-2xl font-bold text-text-primary">{value}</p>
      {change !== undefined && change !== 0 && (
        <p className={`text-xs mt-1 ${change > 0 ? "text-expense" : "text-income"}`}>
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}% vs last month
        </p>
      )}
    </div>
  );
}

function QuickAddExpense({
  categories,
  onClose,
  onSaved,
}: {
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormData>({
    item: "",
    amount: "",
    category_id: categories[0]?.id || "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    is_recurring: false,
    recurring_frequency: null,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item || !form.amount || !form.category_id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Quick Add Expense</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Item / Description</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Lunch at restaurant"
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (RM)</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select
              className="input"
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as ExpenseFormData["payment_method"] })}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary-600"
                checked={form.is_recurring}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_recurring: e.target.checked,
                    recurring_frequency: e.target.checked ? "monthly" : null,
                  })
                }
              />
              <span className="text-sm text-text-secondary">Recurring expense</span>
            </label>
          </div>
          {form.is_recurring && (
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={form.recurring_frequency || "monthly"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurring_frequency: e.target.value as ExpenseFormData["recurring_frequency"],
                  })
                }
              >
                {RECURRING_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Any additional details..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
