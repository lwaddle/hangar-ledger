"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory } from "@/types/database";

export type ExpenseCategoryFormData = {
  name: string;
  notes?: string;
};

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}


export async function getExpenseCategory(
  id: string
): Promise<ExpenseCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
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

export async function createExpenseCategory(
  formData: ExpenseCategoryFormData
): Promise<ExpenseCategory> {
  const supabase = await createClient();

  // Check if a soft-deleted category with the same name exists
  const { data: deletedCategory } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("name", formData.name)
    .not("deleted_at", "is", null)
    .single();

  // If found, restore it instead of creating a new one
  if (deletedCategory) {
    const { data, error } = await supabase
      .from("expense_categories")
      .update({
        deleted_at: null,
        notes: formData.notes || deletedCategory.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deletedCategory.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/expense-categories");
    return data;
  }

  // Otherwise, create a new category
  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      name: formData.name,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/expense-categories");
  return data;
}

export async function createExpenseCategoryAndRedirect(
  formData: ExpenseCategoryFormData
): Promise<void> {
  await createExpenseCategory(formData);
  redirect("/expense-categories");
}

export async function updateExpenseCategory(
  id: string,
  formData: ExpenseCategoryFormData
): Promise<void> {
  const supabase = await createClient();

  // Get the old category to check if it's a system category
  const { data: oldCategory } = await supabase
    .from("expense_categories")
    .select("name, is_system")
    .eq("id", id)
    .single();

  // Prevent modification of system categories
  if (oldCategory?.is_system) {
    throw new Error("System categories cannot be modified");
  }

  const { error } = await supabase
    .from("expense_categories")
    .update({
      name: formData.name,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;

  // Update denormalized category field on expenses if name changed
  if (oldCategory && oldCategory.name !== formData.name) {
    await supabase
      .from("expenses")
      .update({ category: formData.name })
      .eq("category_id", id);

    await supabase
      .from("expense_line_items")
      .update({ category: formData.name })
      .eq("category_id", id);
  }

  revalidatePath("/expense-categories");
  revalidatePath(`/expense-categories/${id}`);
  revalidatePath("/expenses");
  redirect(`/expense-categories/${id}`);
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if this is a system category
  const { data: category } = await supabase
    .from("expense_categories")
    .select("is_system")
    .eq("id", id)
    .single();

  if (category?.is_system) {
    throw new Error("System categories cannot be deleted");
  }

  const { error } = await supabase
    .from("expense_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/expense-categories");
  redirect("/expense-categories");
}

export async function getLineItemsByCategory(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_line_items")
    .select(
      `
      *,
      expenses!inner (
        id,
        date,
        vendor,
        deleted_at
      )
    `
    )
    .eq("category_id", categoryId)
    .is("expenses.deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getLineItemCountByCategory(
  categoryId: string
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("expense_line_items")
    .select("*, expenses!inner(deleted_at)", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .is("expenses.deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function reassignLineItemsAndDeleteExpenseCategory(
  sourceCategoryId: string,
  targetCategoryId: string
): Promise<void> {
  const supabase = await createClient();

  // Check if source category is a system category
  const { data: sourceCategory } = await supabase
    .from("expense_categories")
    .select("is_system")
    .eq("id", sourceCategoryId)
    .single();

  if (sourceCategory?.is_system) {
    throw new Error("System categories cannot be deleted");
  }

  // Get target category name
  const { data: targetCategory, error: categoryError } = await supabase
    .from("expense_categories")
    .select("name")
    .eq("id", targetCategoryId)
    .single();

  if (categoryError) throw categoryError;

  // Update all line items from source category to target category
  const { error: lineItemError } = await supabase
    .from("expense_line_items")
    .update({
      category_id: targetCategoryId,
      category: targetCategory.name,
    })
    .eq("category_id", sourceCategoryId);

  if (lineItemError) throw lineItemError;

  // Update expenses that have this category_id as their primary category
  const { error: expenseError } = await supabase
    .from("expenses")
    .update({
      category_id: targetCategoryId,
      category: targetCategory.name,
    })
    .eq("category_id", sourceCategoryId);

  if (expenseError) throw expenseError;

  // Soft-delete the source category
  const { error: deleteError } = await supabase
    .from("expense_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sourceCategoryId);

  if (deleteError) throw deleteError;

  revalidatePath("/expense-categories");
  revalidatePath("/expenses");
  revalidatePath(`/expense-categories/${targetCategoryId}`);
  redirect("/expense-categories");
}

export async function toggleExpenseCategoryActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient();

  // Check if this is a system category
  const { data: category } = await supabase
    .from("expense_categories")
    .select("is_system")
    .eq("id", id)
    .single();

  if (category?.is_system) {
    throw new Error("System categories cannot be deactivated");
  }

  const { error } = await supabase
    .from("expense_categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/expense-categories");
  revalidatePath(`/expense-categories/${id}`);
}
