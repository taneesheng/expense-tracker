"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Palette, Save, Download, Upload, Link } from "lucide-react";
import { Category } from "@/lib/types";

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCategories(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCatName.trim(),
        color: newCatColor,
        icon: "more-horizontal",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories([...categories, data]);
      setNewCatName("");
    }
  };

  const exportData = async () => {
    setExportLoading(true);
    try {
      // Fetch all data
      const [expRes, incRes, catRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/income"),
        fetch("/api/categories"),
      ]);
      const [expenses, income, cats] = await Promise.all([
        expRes.json(),
        incRes.json(),
        catRes.json(),
      ]);

      const exportObj = {
        exported_at: new Date().toISOString(),
        expenses,
        income,
        categories: cats,
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spendwise-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  const installPWA = () => {
    // Check if the app can be installed
    const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void } }).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      alert(
        "To install SpendWise on your device:\n\n" +
        "iPhone/iPad: Tap the Share button, then 'Add to Home Screen'\n\n" +
        "Android: Tap the menu (3 dots), then 'Add to Home screen' or 'Install app'\n\n" +
        "Desktop: Look for the install icon in your browser's address bar"
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Manage categories, data, and app preferences
        </p>
      </div>

      {/* Install PWA */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-2">Install App</h3>
        <p className="text-sm text-text-secondary mb-3">
          Install SpendWise on your device for quick access and offline support.
        </p>
        <button onClick={installPWA} className="btn-primary">
          <Download className="w-4 h-4" /> Install SpendWise
        </button>
      </div>

      {/* Categories Management */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-4">Categories</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-secondary"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-text-primary">{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="New category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <input
            type="color"
            className="w-10 h-10 rounded-lg cursor-pointer border border-border"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
          />
          <button onClick={addCategory} className="btn-primary">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-2">Data Management</h3>
        <p className="text-sm text-text-secondary mb-4">
          Export your data as a JSON backup file.
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="btn-secondary"
            disabled={exportLoading}
          >
            <Download className="w-4 h-4" />
            {exportLoading ? "Exporting..." : "Export Data"}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-2">About SpendWise</h3>
        <div className="text-sm text-text-secondary space-y-1">
          <p>Version 1.0.0</p>
          <p>Personal expense tracking application</p>
          <p>Built with Next.js, Supabase, and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
