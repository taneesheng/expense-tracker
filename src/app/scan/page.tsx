"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Category, PaymentMethod } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    text: string;
    amount: string;
    merchant: string;
    date: string;
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields from scan
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("e_wallet");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setCategories(d);
          if (d.length > 0) setCategoryId(d[0].id);
        }
      });
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanResult(null);
    setSaved(false);

    // Show image preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // OCR Processing
    setScanning(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const text = data.text;
      const extracted = extractReceiptData(text);

      setScanResult({
        text,
        amount: extracted.amount,
        merchant: extracted.merchant,
        date: extracted.date,
      });

      // Pre-fill form
      if (extracted.merchant) setItem(extracted.merchant);
      if (extracted.amount) setAmount(extracted.amount);
      if (extracted.date) setDate(extracted.date);
    } catch (err) {
      setError("Failed to scan receipt. Please try again or enter details manually.");
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const extractReceiptData = (text: string): { amount: string; merchant: string; date: string } => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Try to find total amount
    let amount = "";
    const totalPatterns = [
      /total\s*:?\s*(?:rm|myr)?\s*(\d+[.,]\d{2})/i,
      /(?:grand\s*total|amount\s*due|total\s*amount)\s*:?\s*(?:rm|myr)?\s*(\d+[.,]\d{2})/i,
      /(?:rm|myr)\s*(\d+[.,]\d{2})/i,
    ];
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        amount = match[1].replace(",", ".");
        break;
      }
    }
    // Fallback: find the largest number that looks like a price
    if (!amount) {
      const prices = text.match(/\d+\.\d{2}/g);
      if (prices) {
        const nums = prices.map(Number).filter((n) => n > 0);
        if (nums.length > 0) {
          amount = String(Math.max(...nums));
        }
      }
    }

    // Try to find merchant name (usually first non-empty line)
    let merchant = "";
    for (const line of lines.slice(0, 3)) {
      if (line.length > 2 && line.length < 60 && !/^\d/.test(line)) {
        merchant = line;
        break;
      }
    }

    // Try to find date
    let date = "";
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const parsed = new Date(match[1]);
          if (!isNaN(parsed.getTime())) {
            date = parsed.toISOString().split("T")[0];
          }
        } catch {
          // ignore parse errors
        }
        break;
      }
    }

    return { amount, merchant, date };
  };

  const handleSave = async () => {
    if (!item || !amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          amount,
          category_id: categoryId,
          date,
          payment_method: paymentMethod,
          is_recurring: false,
          notes: scanResult ? "Added via receipt scan" : "",
        }),
      });
      if (res.ok) {
        setSaved(true);
        // Reset after short delay
        setTimeout(() => {
          setImage(null);
          setScanResult(null);
          setSaved(false);
          setItem("");
          setAmount("");
          setDate(new Date().toISOString().split("T")[0]);
        }, 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Scan Receipt</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Take a photo or upload a receipt to automatically extract expense details
        </p>
      </div>

      {/* Upload Area */}
      {!image && (
        <div className="card p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <p className="text-text-primary font-medium">Upload receipt or take a photo</p>
              <p className="text-sm text-text-muted mt-1">
                Supports JPG, PNG images. We&apos;ll try to extract the details automatically.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn-primary"
              >
                <Camera className="w-4 h-4" /> Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      )}

      {/* Scanning Progress */}
      {scanning && (
        <div className="card p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-text-primary font-medium">Scanning receipt...</p>
          <p className="text-sm text-text-muted mt-1">This may take a moment</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 bg-red-50 border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-expense flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => { setError(null); setImage(null); }}
              className="text-sm text-red-600 font-medium mt-1 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Scan Result + Edit Form */}
      {image && !scanning && (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="card p-3">
            <div className="relative">
              <img
                src={image}
                alt="Receipt"
                className="w-full max-h-64 object-contain rounded-lg"
              />
              <button
                onClick={() => {
                  setImage(null);
                  setScanResult(null);
                  setItem("");
                  setAmount("");
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Extracted Text Preview */}
          {scanResult && (
            <div className="card p-4 bg-surface-secondary">
              <p className="text-xs text-text-muted mb-1 font-medium">Extracted Text:</p>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                {scanResult.text.slice(0, 500)}
              </pre>
            </div>
          )}

          {/* Editable Form */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-text-primary">Confirm Details</h3>
            <div>
              <label className="label">Item / Merchant</label>
              <input
                type="text"
                className="input"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="What did you buy?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (RM)</label>
                <input
                  type="number"
                  className="input"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setImage(null);
                  setScanResult(null);
                  setItem("");
                  setAmount("");
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
                disabled={saving || saved || !item || !amount}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" /> Saved!
                  </>
                ) : saving ? (
                  "Saving..."
                ) : (
                  `Save ${amount ? formatCurrency(parseFloat(amount)) : "Expense"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
