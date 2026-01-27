"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseLineItem, ExpenseLineItemInput } from "@/types/database";

export type ExpenseFormData = {
  trip_id?: string;
  vendor_id?: string;
  payment_method_id?: string;
  date: string;
  vendor: string;
  payment_method?: string;
  location?: string;
  notes?: string;
  line_items: ExpenseLineItemInput[];
};

function getPrimaryCategory(lineItems: ExpenseLineItemInput[]): {
  category: string;
  category_id: string | null;
} {
  if (lineItems.length === 0) return { category: "Other", category_id: null };
  if (lineItems.length === 1)
    return {
      category: lineItems[0].category,
      category_id: lineItems[0].category_id,
    };
  const maxItem = lineItems.reduce((max, item) =>
    item.amount > max.amount ? item : max
  );
  return { category: maxItem.category, category_id: maxItem.category_id };
}

export type ExpenseWithTrip = Expense & {
  trips: { name: string; is_locked: boolean } | null;
  vendors: { is_active: boolean } | null;
  payment_methods: { name: string; is_active: boolean } | null;
  expense_line_items?: (ExpenseLineItem & {
    expense_categories: { is_active: boolean } | null;
  })[];
  updated_by_profile: { email: string; display_name: string | null } | null;
};

export type ExpenseWithRelations = Expense & {
  trips: { name: string } | null;
  vendors: { deleted_at: string | null } | null;
  expense_line_items: ExpenseLineItem[];
};

export async function getExpenses(): Promise<ExpenseWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, trips(name), vendors(deleted_at), expense_line_items(*)")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;

  // Sort line items by sort_order for each expense
  return (data ?? []).map((expense) => ({
    ...expense,
    expense_line_items: (expense.expense_line_items ?? []).sort(
      (a: ExpenseLineItem, b: ExpenseLineItem) => a.sort_order - b.sort_order
    ),
  }));
}

export type ExpenseWithVendor = Expense & {
  vendors: { deleted_at: string | null } | null;
};

export type ExpenseWithLineItems = ExpenseWithVendor & {
  expense_line_items: ExpenseLineItem[];
};

export async function getExpensesByTrip(tripId: string): Promise<ExpenseWithLineItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, vendors(deleted_at), expense_line_items(*)")
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;

  // Sort line items by sort_order for each expense
  return (data ?? []).map((expense) => ({
    ...expense,
    expense_line_items: (expense.expense_line_items ?? []).sort(
      (a: ExpenseLineItem, b: ExpenseLineItem) => a.sort_order - b.sort_order
    ),
  }));
}

export async function getExpense(id: string): Promise<ExpenseWithTrip | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, trips(name, is_locked), vendors(is_active), payment_methods(name, is_active), expense_line_items(*, expense_categories(is_active)), updated_by_profile:user_profiles!expenses_updated_by_profile_fkey(email, display_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // Sort line items by sort_order
  if (data?.expense_line_items) {
    data.expense_line_items.sort((a: ExpenseLineItem, b: ExpenseLineItem) => a.sort_order - b.sort_order);
  }

  return data;
}

export async function createExpense(formData: ExpenseFormData): Promise<void> {
  const supabase = await createClient();

  // Check if the associated trip is locked (non-admins can't add expenses to locked trips)
  if (formData.trip_id) {
    const tripLocked = await isTripLocked(formData.trip_id);
    if (tripLocked && !(await isUserAdmin())) {
      throw new Error("Cannot add expense to a locked trip");
    }
  }

  const totalAmount = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  const { category: primaryCategory, category_id: primaryCategoryId } =
    getPrimaryCategory(formData.line_items);

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      trip_id: formData.trip_id || null,
      vendor_id: formData.vendor_id || null,
      payment_method_id: formData.payment_method_id || null,
      category_id: primaryCategoryId,
      date: formData.date,
      vendor: formData.vendor,
      amount: totalAmount,
      category: primaryCategory,
      payment_method: formData.payment_method || null,
      location: formData.location || null,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  const lineItemsToInsert = formData.line_items.map((item, index) => ({
    expense_id: expense.id,
    category_id: item.category_id,
    description: item.description || null,
    category: item.category,
    amount: item.amount,
    quantity_gallons: item.quantity_gallons,
    sort_order: index,
  }));

  const { error: lineItemsError } = await supabase
    .from("expense_line_items")
    .insert(lineItemsToInsert);

  if (lineItemsError) throw lineItemsError;

  revalidatePath("/expenses");
  if (formData.trip_id) {
    revalidatePath(`/trips/${formData.trip_id}`);
    redirect(`/trips/${formData.trip_id}`);
  } else {
    redirect("/expenses");
  }
}

export async function createExpenseAndGetId(formData: ExpenseFormData): Promise<string> {
  const supabase = await createClient();

  // Check if the associated trip is locked (non-admins can't add expenses to locked trips)
  if (formData.trip_id) {
    const tripLocked = await isTripLocked(formData.trip_id);
    if (tripLocked && !(await isUserAdmin())) {
      throw new Error("Cannot add expense to a locked trip");
    }
  }

  const totalAmount = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  const { category: primaryCategory, category_id: primaryCategoryId } =
    getPrimaryCategory(formData.line_items);

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      trip_id: formData.trip_id || null,
      vendor_id: formData.vendor_id || null,
      payment_method_id: formData.payment_method_id || null,
      category_id: primaryCategoryId,
      date: formData.date,
      vendor: formData.vendor,
      amount: totalAmount,
      category: primaryCategory,
      payment_method: formData.payment_method || null,
      location: formData.location || null,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  const lineItemsToInsert = formData.line_items.map((item, index) => ({
    expense_id: expense.id,
    category_id: item.category_id,
    description: item.description || null,
    category: item.category,
    amount: item.amount,
    quantity_gallons: item.quantity_gallons,
    sort_order: index,
  }));

  const { error: lineItemsError } = await supabase
    .from("expense_line_items")
    .insert(lineItemsToInsert);

  if (lineItemsError) throw lineItemsError;

  revalidatePath("/expenses");
  if (formData.trip_id) {
    revalidatePath(`/trips/${formData.trip_id}`);
  }

  return expense.id;
}

export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<void> {
  const supabase = await createClient();

  // Check if the expense is effectively locked (non-admins can't edit locked expenses)
  const lockStatus = await isExpenseEffectivelyLocked(id);
  if (lockStatus.isLocked && !(await isUserAdmin())) {
    throw new Error("Cannot edit a locked expense");
  }

  // Also check if changing to a locked trip (non-admins can't move expenses to locked trips)
  if (formData.trip_id) {
    const tripLocked = await isTripLocked(formData.trip_id);
    if (tripLocked && !(await isUserAdmin())) {
      throw new Error("Cannot move expense to a locked trip");
    }
  }

  const totalAmount = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  const { category: primaryCategory, category_id: primaryCategoryId } =
    getPrimaryCategory(formData.line_items);

  const { error: expenseError } = await supabase
    .from("expenses")
    .update({
      trip_id: formData.trip_id || null,
      vendor_id: formData.vendor_id || null,
      payment_method_id: formData.payment_method_id || null,
      category_id: primaryCategoryId,
      date: formData.date,
      vendor: formData.vendor,
      amount: totalAmount,
      category: primaryCategory,
      payment_method: formData.payment_method || null,
      location: formData.location || null,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (expenseError) throw expenseError;

  // Delete existing line items and insert new ones
  const { error: deleteError } = await supabase
    .from("expense_line_items")
    .delete()
    .eq("expense_id", id);

  if (deleteError) throw deleteError;

  const lineItemsToInsert = formData.line_items.map((item, index) => ({
    expense_id: id,
    category_id: item.category_id,
    description: item.description || null,
    category: item.category,
    amount: item.amount,
    quantity_gallons: item.quantity_gallons,
    sort_order: index,
  }));

  const { error: lineItemsError } = await supabase
    .from("expense_line_items")
    .insert(lineItemsToInsert);

  if (lineItemsError) throw lineItemsError;

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
  if (formData.trip_id) {
    revalidatePath(`/trips/${formData.trip_id}`);
  }
  redirect(`/expenses/${id}`);
}

export async function canUserDeleteExpense(expenseId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Admins can delete any expense
  if (profile?.role === "admin") return true;

  // Operators can only delete their own unlocked expenses
  if (profile?.role === "operator") {
    const { data: expense } = await supabase
      .from("expenses")
      .select("created_by")
      .eq("id", expenseId)
      .single();

    if (expense?.created_by !== user.id) return false;

    // Check if expense is effectively locked
    const lockStatus = await isExpenseEffectivelyLocked(expenseId);
    return !lockStatus.isLocked;
  }

  return false;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if user can delete this expense
  const canDelete = await canUserDeleteExpense(id);
  if (!canDelete) {
    throw new Error("You do not have permission to delete this expense");
  }

  // Soft delete
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function lockExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("expenses")
    .update({
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: user.id,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
}

export async function unlockExpense(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Only admins can unlock expenses");
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      is_locked: false,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
}

export async function isExpenseEffectivelyLocked(
  id: string
): Promise<{ isLocked: boolean; isTripLocked: boolean; isExpenseLocked: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("is_locked, trips(is_locked)")
    .eq("id", id)
    .single();

  if (error) throw error;

  const isExpenseLocked = data?.is_locked ?? false;
  const tripData = data?.trips as unknown as { is_locked: boolean } | null;
  const isTripLocked = tripData?.is_locked ?? false;

  return {
    isLocked: isExpenseLocked || isTripLocked,
    isTripLocked,
    isExpenseLocked,
  };
}

async function isTripLocked(tripId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("is_locked")
    .eq("id", tripId)
    .single();
  return data?.is_locked ?? false;
}

async function isUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}
