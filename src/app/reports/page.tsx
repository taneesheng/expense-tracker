"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, getPaymentMethodLabel, getMonthName } from "@/lib/utils";
import { MonthlyReport, PaymentMethod } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
      const data = await res.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const navigateMonth = (dir: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1));
  };

  const exportCSV = () => {
    if (!report) return;
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    let csv = "Category,Amount,Percentage,Count\n";
    report.by_category.forEach((cat) => {
      csv += `"${cat.category_name}",${cat.total},${cat.percentage.toFixed(1)}%,${cat.count}\n`;
    });
    csv += `\nPayment Method,Amount,Percentage,Count\n`;
    report.by_payment_method.forEach((pm) => {
      csv += `"${getPaymentMethodLabel(pm.method as PaymentMethod)}",${pm.total},${pm.percentage.toFixed(1)}%,${pm.count}\n`;
    });
    csv += `\nSummary\n`;
    csv += `Total Expenses,${report.total_expenses}\n`;
    csv += `Total Income,${report.total_income}\n`;
    csv += `Savings,${report.savings}\n`;
    csv += `Savings Rate,${report.savings_rate.toFixed(1)}%\n`;
    csv += `Daily Average,${report.daily_average.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-report-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const month = currentMonth.getMonth() + 1;
  const year = currentMonth.getFullYear();

  const incomeVsExpenseData = [
    { name: "Income", amount: report?.total_income || 0, fill: "#10b981" },
    { name: "Expenses", amount: report?.total_expenses || 0, fill: "#f43f5e" },
    { name: "Savings", amount: Math.max(report?.savings || 0, 0), fill: "#6366f1" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Monthly Report</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Detailed financial summary
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Month Navigator */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <p className="text-lg font-bold text-text-primary">
          {getMonthName(month)} {year}
        </p>
        <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Income vs Expense Overview */}
      <div className="card p-6">
        <h3 className="font-semibold text-text-primary mb-4">Income vs Expenses</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <TrendingUp className="w-6 h-6 text-income mx-auto mb-1" />
            <p className="text-xs text-text-muted">Income</p>
            <p className="text-xl font-bold text-income">{formatCurrency(report?.total_income || 0)}</p>
          </div>
          <div className="text-center">
            <TrendingDown className="w-6 h-6 text-expense mx-auto mb-1" />
            <p className="text-xs text-text-muted">Expenses</p>
            <p className="text-xl font-bold text-expense">{formatCurrency(report?.total_expenses || 0)}</p>
          </div>
          <div className="text-center">
            <PiggyBank className="w-6 h-6 text-primary-500 mx-auto mb-1" />
            <p className="text-xs text-text-muted">Net Savings</p>
            <p className={`text-xl font-bold ${(report?.savings || 0) >= 0 ? "text-income" : "text-expense"}`}>
              {formatCurrency(report?.savings || 0)}
            </p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis tickFormatter={(v) => `${CURRENCY_SYMBOL}${v}`} fontSize={12} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {incomeVsExpenseData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings Rate Indicator */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-3">Savings Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-surface-secondary rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(report?.savings_rate || 0, 0), 100)}%`,
                  backgroundColor: (report?.savings_rate || 0) >= 20 ? "#10b981" : (report?.savings_rate || 0) >= 0 ? "#f59e0b" : "#f43f5e",
                }}
              />
            </div>
          </div>
          <span className={`text-lg font-bold ${(report?.savings_rate || 0) >= 20 ? "text-income" : (report?.savings_rate || 0) >= 0 ? "text-warning" : "text-expense"}`}>
            {(report?.savings_rate || 0).toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          {(report?.savings_rate || 0) >= 20 ? (
            <>
              <CheckCircle className="w-4 h-4 text-income" />
              <span className="text-income">Excellent! Above the recommended 20% savings rate.</span>
            </>
          ) : (report?.savings_rate || 0) >= 0 ? (
            <>
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-warning">Below the recommended 20% savings rate.</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-expense" />
              <span className="text-expense">You are spending more than you earn!</span>
            </>
          )}
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-4">Spending by Category</h3>
        {report?.by_category && report.by_category.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text-muted font-medium">Category</th>
                  <th className="text-right py-2 text-text-muted font-medium">Amount</th>
                  <th className="text-right py-2 text-text-muted font-medium">%</th>
                  <th className="text-right py-2 text-text-muted font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {report.by_category.map((cat) => (
                  <tr key={cat.category_id} className="border-b border-border last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color }} />
                        <span className="text-text-primary">{cat.category_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-medium">{formatCurrency(cat.total)}</td>
                    <td className="py-2.5 text-right text-text-muted">{cat.percentage.toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-text-muted">{cat.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="py-2.5 font-semibold">Total</td>
                  <td className="py-2.5 text-right font-bold text-expense">
                    {formatCurrency(report.total_expenses)}
                  </td>
                  <td className="py-2.5 text-right font-medium">100%</td>
                  <td className="py-2.5 text-right text-text-muted">
                    {report.by_category.reduce((sum, c) => sum + c.count, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-8">No expenses this month</p>
        )}
      </div>

      {/* Payment Methods Table */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-4">Payment Methods</h3>
        {report?.by_payment_method && report.by_payment_method.length > 0 ? (
          <div className="space-y-3">
            {report.by_payment_method.map((pm) => (
              <div key={pm.method} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">
                      {getPaymentMethodLabel(pm.method as PaymentMethod)}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(pm.total)}</span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-2">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-text-muted w-10 text-right">{pm.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-8">No data available</p>
        )}
      </div>

      {/* Biggest Expense */}
      {report?.biggest_expense && (
        <div className="card p-5">
          <h3 className="font-semibold text-text-primary mb-3">Biggest Single Expense</h3>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: report.biggest_expense.category?.color || "#607D8B" }}
            >
              {report.biggest_expense.item.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{report.biggest_expense.item}</p>
              <p className="text-sm text-text-muted">
                {report.biggest_expense.category?.name} &middot; {new Date(report.biggest_expense.date).toLocaleDateString()}
              </p>
            </div>
            <p className="text-xl font-bold text-expense">{formatCurrency(report.biggest_expense.amount)}</p>
          </div>
        </div>
      )}

      {/* Advice */}
      {report?.advice && report.advice.length > 0 && (
        <div className="card p-5 bg-primary-50/50 border-primary-200">
          <h3 className="font-semibold text-primary-800 mb-3">Financial Advice</h3>
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

