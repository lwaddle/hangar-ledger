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
  notes?: string;
  line_items: ExpenseLineItemInput[];
};

function getPrimaryCategory(lineItems: ExpenseLineItemInput[]): string {
  if (lineItems.length === 0) return "Other";
  if (lineItems.length === 1) return lineItems[0].category;
  return lineItems.reduce((max, item) => (item.amount > max.amount ? item : max)).category;
}

export type ExpenseWithTrip = Expense & {
  trips: { name: string } | null;
  payment_methods: { name: string } | null;
  expense_line_items?: ExpenseLineItem[];
};

export type ExpenseWithRelations = Expense & {
  trips: { name: string } | null;
  vendors: { deleted_at: string | null } | null;
};

export async function getExpenses(): Promise<ExpenseWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, trips(name), vendors(deleted_at)")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type ExpenseWithVendor = Expense & {
  vendors: { deleted_at: string | null } | null;
};

export async function getExpensesByTrip(tripId: string): Promise<ExpenseWithVendor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, vendors(deleted_at)")
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getExpense(id: string): Promise<ExpenseWithTrip | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, trips(name), payment_methods(name), expense_line_items(*)")
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

  const totalAmount = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  const primaryCategory = getPrimaryCategory(formData.line_items);

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      trip_id: formData.trip_id || null,
      vendor_id: formData.vendor_id || null,
      payment_method_id: formData.payment_method_id || null,
      date: formData.date,
      vendor: formData.vendor,
      amount: totalAmount,
      category: primaryCategory,
      payment_method: formData.payment_method || null,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  const lineItemsToInsert = formData.line_items.map((item, index) => ({
    expense_id: expense.id,
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

export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<void> {
  const supabase = await createClient();

  const totalAmount = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  const primaryCategory = getPrimaryCategory(formData.line_items);

  const { error: expenseError } = await supabase
    .from("expenses")
    .update({
      trip_id: formData.trip_id || null,
      vendor_id: formData.vendor_id || null,
      payment_method_id: formData.payment_method_id || null,
      date: formData.date,
      vendor: formData.vendor,
      amount: totalAmount,
      category: primaryCategory,
      payment_method: formData.payment_method || null,
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

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  // Soft delete
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/expenses");
  redirect("/expenses");
}
