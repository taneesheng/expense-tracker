import { PaymentMethod, RecurringFrequency } from "./types";

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "MYR";
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "RM";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export const RECURRING_FREQUENCIES: {
  value: RecurringFrequency;
  label: string;
}[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const CATEGORY_ICONS: Record<string, string> = {
  utensils: "Utensils",
  car: "Car",
  "shopping-bag": "ShoppingBag",
  zap: "Zap",
  film: "Film",
  heart: "Heart",
  "book-open": "BookOpen",
  "shopping-cart": "ShoppingCart",
  home: "Home",
  shield: "Shield",
  "trending-up": "TrendingUp",
  scissors: "Scissors",
  plane: "Plane",
  gift: "Gift",
  "more-horizontal": "MoreHorizontal",
};

export const CHART_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
  "#ef4444",
  "#22c55e",
  "#64748b",
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
