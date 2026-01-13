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

export type Vendor = {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PaymentMethod = {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  is_flight_expense: boolean;
  is_general_expense: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Expense = {
  id: string;
  trip_id: string | null;
  vendor_id: string | null;
  payment_method_id: string | null;
  category_id: string | null;
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

export type Receipt = {
  id: string;
  expense_id: string;
  storage_path: string;
  original_filename: string | null;
  uploaded_by: string;
  uploaded_at: string;
};

export type ExpenseLineItem = {
  id: string;
  expense_id: string;
  category_id: string | null;
  description: string | null;
  category: string;
  amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ExpenseLineItemInput = {
  id?: string;
  category_id: string | null;
  description: string | null;
  category: string;
  amount: number;
  sort_order: number;
};

// Expense categories - DEPRECATED: Use expense_categories table instead
// Kept temporarily for backwards compatibility during migration
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

export type ExpenseCategoryName = (typeof EXPENSE_CATEGORIES)[number];

// User roles
export type UserRole = "admin" | "operator" | "viewer";
