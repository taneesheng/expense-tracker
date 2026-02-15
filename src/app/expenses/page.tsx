"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Expense, Category, ExpenseFormData, PaymentMethod } from "@/lib/types";
import { PAYMENT_METHODS, RECURRING_FREQUENCIES } from "@/lib/constants";
import { formatCurrency, formatDate, getPaymentMethodLabel } from "@/lib/utils";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterRecurring, setFilterRecurring] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (filterCategory) params.set("category_id", filterCategory);
    if (filterPayment) params.set("payment_method", filterPayment);
    if (filterRecurring) params.set("is_recurring", "true");
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, filterCategory, filterPayment, filterRecurring, searchQuery]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCategories(d); });
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    fetchExpenses();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const navigateMonth = (dir: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1)
    );
  };

  const totalMonth = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage and track your spending
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Month Navigator + Total */}
      <div className="card p-4 flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-surface-secondary"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-text-primary">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-expense font-medium">
            Total: {formatCurrency(totalMonth)}
          </p>
        </div>
        <button
          onClick={() => navigateMonth(1)}
          className="p-1.5 rounded-lg hover:bg-surface-secondary"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary ${showFilters ? "bg-primary-50 border-primary-300 text-primary-700" : ""}`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
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
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary-600"
                checked={filterRecurring}
                onChange={(e) => setFilterRecurring(e.target.checked)}
              />
              <span className="text-sm text-text-secondary">Recurring only</span>
            </label>
          </div>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text-muted text-sm">No expenses found for this month.</p>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="btn-primary mt-4"
          >
            <Plus className="w-4 h-4" /> Add your first expense
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: expense.category?.color || "#607D8B" }}
              >
                {expense.item.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {expense.item}
                  </p>
                  {expense.is_recurring && (
                    <RefreshCw className="w-3 h-3 text-primary-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {expense.category?.name} &middot; {formatDate(expense.date)} &middot;{" "}
                  {getPaymentMethodLabel(expense.payment_method as PaymentMethod)}
                </p>
              </div>
              <span className="text-sm font-bold text-expense flex-shrink-0">
                -{formatCurrency(expense.amount)}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(expense)}
                  className="p-1.5 rounded hover:bg-surface-secondary text-text-muted hover:text-primary-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ExpenseFormModal
          categories={categories}
          expense={editingExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingExpense(null);
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}

function ExpenseFormModal({
  categories,
  expense,
  onClose,
  onSaved,
}: {
  categories: Category[];
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormData>({
    item: expense?.item || "",
    amount: expense ? String(expense.amount) : "",
    category_id: expense?.category_id || categories[0]?.id || "",
    date: expense?.date || new Date().toISOString().split("T")[0],
    payment_method: (expense?.payment_method as PaymentMethod) || "cash",
    is_recurring: expense?.is_recurring || false,
    recurring_frequency: expense?.recurring_frequency as ExpenseFormData["recurring_frequency"] || null,
    notes: expense?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = expense ? "PUT" : "POST";
      const body = expense ? { ...form, id: expense.id } : form;
      const res = await fetch("/api/expenses", {
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
          <h2 className="text-lg font-semibold">
            {expense ? "Edit Expense" : "Add Expense"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded">
            <X className="w-5 h-5" />
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
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })}
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
              {saving ? "Saving..." : expense ? "Update" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
