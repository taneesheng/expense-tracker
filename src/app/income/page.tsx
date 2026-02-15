"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Income, IncomeFormData } from "@/lib/types";
import { RECURRING_FREQUENCIES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function IncomePage() {
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      .toISOString().split("T")[0];
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      .toISOString().split("T")[0];

    try {
      const res = await fetch(`/api/income?start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      if (Array.isArray(data)) setIncomeList(data);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income record?")) return;
    await fetch(`/api/income?id=${id}`, { method: "DELETE" });
    fetchIncome();
  };

  const navigateMonth = (dir: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1)
    );
  };

  const totalIncome = incomeList.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Income</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track your earnings</p>
        </div>
        <button
          onClick={() => { setEditingIncome(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Income</span>
        </button>
      </div>

      {/* Month Navigator */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-text-primary">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-income font-medium">Total: {formatCurrency(totalIncome)}</p>
        </div>
        <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Income List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : incomeList.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text-muted text-sm">No income recorded this month.</p>
          <button
            onClick={() => { setEditingIncome(null); setShowForm(true); }}
            className="btn-primary mt-4"
          >
            <Plus className="w-4 h-4" /> Add income
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {incomeList.map((income) => (
            <div key={income.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-income" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{income.source}</p>
                  {income.is_recurring && <RefreshCw className="w-3 h-3 text-primary-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-text-muted">
                  {formatDate(income.date)}
                  {income.notes && ` · ${income.notes}`}
                </p>
              </div>
              <span className="text-sm font-bold text-income flex-shrink-0">
                +{formatCurrency(income.amount)}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => { setEditingIncome(income); setShowForm(true); }}
                  className="p-1.5 rounded hover:bg-surface-secondary text-text-muted hover:text-primary-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(income.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <IncomeFormModal
          income={editingIncome}
          onClose={() => { setShowForm(false); setEditingIncome(null); }}
          onSaved={() => { setShowForm(false); setEditingIncome(null); fetchIncome(); }}
        />
      )}
    </div>
  );
}

function IncomeFormModal({
  income,
  onClose,
  onSaved,
}: {
  income: Income | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<IncomeFormData>({
    source: income?.source || "",
    amount: income ? String(income.amount) : "",
    date: income?.date || new Date().toISOString().split("T")[0],
    is_recurring: income?.is_recurring || false,
    recurring_frequency: income?.recurring_frequency as IncomeFormData["recurring_frequency"] || null,
    notes: income?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = income ? "PUT" : "POST";
      const body = income ? { ...form, id: income.id } : form;
      const res = await fetch("/api/income", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          <h2 className="text-lg font-semibold">{income ? "Edit Income" : "Add Income"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Source</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Salary, Freelance, etc."
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
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
              <span className="text-sm text-text-secondary">Recurring income</span>
            </label>
          </div>
          {form.is_recurring && (
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={form.recurring_frequency || "monthly"}
                onChange={(e) =>
                  setForm({ ...form, recurring_frequency: e.target.value as IncomeFormData["recurring_frequency"] })
                }
              >
                {RECURRING_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
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
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving..." : income ? "Update" : "Add Income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
