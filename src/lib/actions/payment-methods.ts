"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, ExpenseLineItem } from "@/types/database";
import type { ExpenseWithLineItems } from "@/lib/actions/expenses";

export type PaymentMethodFormData = {
  name: string;
  notes?: string;
};

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPaymentMethod(id: string): Promise<PaymentMethod | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createPaymentMethod(formData: PaymentMethodFormData): Promise<PaymentMethod> {
  const supabase = await createClient();

  // Check if a soft-deleted payment method with the same name exists
  const { data: deletedPaymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("name", formData.name)
    .not("deleted_at", "is", null)
    .single();

  // If found, restore it instead of creating a new one
  if (deletedPaymentMethod) {
    const { data, error } = await supabase
      .from("payment_methods")
      .update({
        deleted_at: null,
        notes: formData.notes || deletedPaymentMethod.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deletedPaymentMethod.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/payment-methods");
    return data;
  }

  // Otherwise, create a new payment method
  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      name: formData.name,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/payment-methods");
  return data;
}

export async function createPaymentMethodAndRedirect(
  formData: PaymentMethodFormData
): Promise<void> {
  await createPaymentMethod(formData);
  redirect("/payment-methods");
}

export async function updatePaymentMethod(
  id: string,
  formData: PaymentMethodFormData
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({
      name: formData.name,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/payment-methods");
  revalidatePath(`/payment-methods/${id}`);
  redirect(`/payment-methods/${id}`);
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/payment-methods");
  redirect("/payment-methods");
}

export async function getExpensesByPaymentMethod(paymentMethodId: string): Promise<ExpenseWithLineItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, vendors(deleted_at), expense_line_items(*)")
    .eq("payment_method_id", paymentMethodId)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((expense) => ({
    ...expense,
    expense_line_items: (expense.expense_line_items ?? []).sort(
      (a: ExpenseLineItem, b: ExpenseLineItem) => a.sort_order - b.sort_order
    ),
  }));
}

export async function getExpenseCountByPaymentMethod(paymentMethodId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("payment_method_id", paymentMethodId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function reassignExpensesAndDeletePaymentMethod(
  sourcePaymentMethodId: string,
  targetPaymentMethodId: string
): Promise<void> {
  const supabase = await createClient();

  // Get target payment method name
  const { data: targetPaymentMethod, error: paymentMethodError } = await supabase
    .from("payment_methods")
    .select("name")
    .eq("id", targetPaymentMethodId)
    .single();

  if (paymentMethodError) throw paymentMethodError;

  // Update all expenses from source payment method to target payment method
  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      payment_method_id: targetPaymentMethodId,
      payment_method: targetPaymentMethod.name,
    })
    .eq("payment_method_id", sourcePaymentMethodId)
    .is("deleted_at", null);

  if (updateError) throw updateError;

  // Soft-delete the source payment method
  const { error: deleteError } = await supabase
    .from("payment_methods")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sourcePaymentMethodId);

  if (deleteError) throw deleteError;

  revalidatePath("/payment-methods");
  revalidatePath("/expenses");
  revalidatePath(`/payment-methods/${targetPaymentMethodId}`);
  redirect("/payment-methods");
}

export async function togglePaymentMethodActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_methods")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/payment-methods");
  revalidatePath(`/payment-methods/${id}`);
}
