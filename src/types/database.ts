// Database types - will be replaced with generated types from Supabase CLI
// Run: npx supabase gen types typescript --local > src/types/database.ts

export type Trip = {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Expense = {
  id: string;
  trip_id: string | null;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type FuelEntry = {
  id: string;
  expense_id: string;
  gallons: number;
  cost_per_gallon: number;
  location: string | null;
  created_at: string;
};

export type Receipt = {
  id: string;
  expense_id: string;
  storage_path: string;
  original_filename: string | null;
  uploaded_by: string;
  uploaded_at: string;
};

// Expense categories
export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Maintenance",
  "Hangar",
  "Catering",
  "Charts & Subscriptions",
  "Training",
  "Landing Fees",
  "Handling Fees",
  "Customs",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// User roles
export type UserRole = "admin" | "operator" | "viewer";
