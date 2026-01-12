"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Expense } from "@/types/database";

export type ExpenseFormData = {
  trip_id?: string;
  vendor_id?: string;
  payment_method_id?: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  payment_method?: string;
  notes?: string;
};

export type ExpenseWithTrip = Expense & {
  trips: { name: string } | null;
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
    .select("*, trips(name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createExpense(formData: ExpenseFormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    trip_id: formData.trip_id || null,
    vendor_id: formData.vendor_id || null,
    payment_method_id: formData.payment_method_id || null,
    date: formData.date,
    vendor: formData.vendor,
    amount: formData.amount,
    category: formData.category,
    payment_method: formData.payment_method || null,
    notes: formData.notes || null,
  });

  if (error) throw error;
  revalidatePath("/expenses");
  if (formData.trip_id) {
    revalidatePath(`/trips/${formData.trip_id}`);
  }
  redirect("/expenses");
}

export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      trip_id: formData.trip_id || null,
      vendor_id: formData.vendor_id || null,
      payment_method_id: formData.payment_method_id || null,
      date: formData.date,
      vendor: formData.vendor,
      amount: formData.amount,
      category: formData.category,
      payment_method: formData.payment_method || null,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;
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
