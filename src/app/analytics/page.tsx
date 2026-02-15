"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Award,
} from "lucide-react";
import { formatCurrency, getPaymentMethodLabel } from "@/lib/utils";
import { MonthlyReport, PaymentMethod } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; expenses: number; income: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();

    try {
      // Fetch current month report
      const reportRes = await fetch(`/api/reports?month=${month}&year=${year}`);
      const reportData = await reportRes.json();
      setReport(reportData);

      // Fetch 6-month trend data
      const trendData: { month: string; expenses: number; income: number }[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const promises = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        promises.push(
          fetch(`/api/reports?month=${m}&year=${y}`).then((r) => r.json()).then((data) => ({
            month: `${monthNames[m - 1]} ${y !== year ? y : ""}`.trim(),
            expenses: data.total_expenses || 0,
            income: data.total_income || 0,
            sortKey: d.getTime(),
          }))
        );
      }

      const results = await Promise.all(promises);
      results.sort((a, b) => a.sortKey - b.sortKey);
      trendData.push(...results.map(({ month, expenses, income }) => ({ month, expenses, income })));
      setMonthlyTrend(trendData);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateMonth = (dir: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-0.5">Visualize your spending patterns</p>
        </div>
        <div className="flex gap-1 bg-surface-secondary rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "month" ? "bg-white shadow text-text-primary" : "text-text-muted"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode("year")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "year" ? "bg-white shadow text-text-primary" : "text-text-muted"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <p className="font-semibold text-text-primary">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <TrendingDown className="w-5 h-5 text-expense mx-auto mb-1" />
          <p className="text-xs text-text-muted">Total Spent</p>
          <p className="text-lg font-bold text-expense">{formatCurrency(report?.total_expenses || 0)}</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-income mx-auto mb-1" />
          <p className="text-xs text-text-muted">Total Income</p>
          <p className="text-lg font-bold text-income">{formatCurrency(report?.total_income || 0)}</p>
        </div>
        <div className="card p-4 text-center">
          <Award className="w-5 h-5 text-primary-500 mx-auto mb-1" />
          <p className="text-xs text-text-muted">Biggest Expense</p>
          <p className="text-lg font-bold text-text-primary">
            {report?.biggest_expense ? formatCurrency(report.biggest_expense.amount) : "N/A"}
          </p>
          {report?.biggest_expense && (
            <p className="text-xs text-text-muted truncate">{report.biggest_expense.item}</p>
          )}
        </div>
        <div className="card p-4 text-center">
          <CreditCard className="w-5 h-5 text-info mx-auto mb-1" />
          <p className="text-xs text-text-muted">Savings Rate</p>
          <p className={`text-lg font-bold ${(report?.savings_rate || 0) >= 0 ? "text-income" : "text-expense"}`}>
            {(report?.savings_rate || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-text-primary mb-4">Spending by Category</h3>
          {report?.by_category && report.by_category.length > 0 ? (
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.by_category}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="category_name"
                      label={({ category_name, percentage }) =>
                        `${category_name.length > 10 ? category_name.slice(0, 10) + "..." : category_name} ${percentage.toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {report.by_category.map((entry, i) => (
                        <Cell key={i} fill={entry.category_color || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {report.by_category.map((cat) => (
                  <div key={cat.category_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color }} />
                      <span className="text-text-secondary">{cat.category_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted text-xs">{cat.count} items</span>
                      <span className="font-medium">{formatCurrency(cat.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">No data for this month</p>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-text-primary mb-4">Payment Methods</h3>
          {report?.by_payment_method && report.by_payment_method.length > 0 ? (
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.by_payment_method} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(v) => `RM${v}`} fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="method"
                      width={100}
                      fontSize={12}
                      tickFormatter={(v) => getPaymentMethodLabel(v as PaymentMethod)}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {report.by_payment_method.map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {getPaymentMethodLabel(pm.method as PaymentMethod)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted text-xs">{pm.percentage.toFixed(0)}%</span>
                      <span className="font-medium">{formatCurrency(pm.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">No data for this month</p>
          )}
        </div>

        {/* 6-Month Trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-text-primary mb-4">6-Month Trend: Income vs Expenses</h3>
          {monthlyTrend.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis tickFormatter={(v) => `RM${v}`} fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">Not enough data for trend</p>
          )}
        </div>
      </div>

      {/* Advice */}
      {report?.advice && report.advice.length > 0 && (
        <div className="card p-5 bg-primary-50/50 border-primary-200">
          <h3 className="font-semibold text-primary-800 mb-3">Analysis & Advice</h3>
          <div className="space-y-2">
            {report.advice.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-primary-700">
                <span className="text-primary-400 mt-0.5 font-bold">{i + 1}.</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
