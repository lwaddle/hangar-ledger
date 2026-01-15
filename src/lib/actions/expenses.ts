"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseLineItem, ExpenseLineItemInput } from "@/types/database";
import type { UpdateResult } from "@/types/collaboration";
import {
  attemptAutoMerge,
  createConflictData,
  successResult,
  versionConflictResult,
  notFoundResult,
  unknownErrorResult,
} from "@/lib/collaboration/conflict-utils";
import { getUserDisplayInfo } from "@/lib/actions/users";

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
  trips: { name: string } | null;
  vendors: { is_active: boolean } | null;
  payment_methods: { name: string; is_active: boolean } | null;
  expense_line_items?: (ExpenseLineItem & {
    expense_categories: { is_active: boolean } | null;
  })[];
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
    .select("*, trips(name), vendors(is_active), payment_methods(name, is_active), expense_line_items(*, expense_categories(is_active))")
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

export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<void> {
  const supabase = await createClient();

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

/**
 * Fields that are compared for conflict detection in expenses
 */
const EXPENSE_CONFLICT_FIELDS: (keyof Expense)[] = [
  "trip_id",
  "vendor_id",
  "payment_method_id",
  "category_id",
  "date",
  "vendor",
  "amount",
  "category",
  "payment_method",
  "notes",
];

/**
 * Update expense with optimistic locking - returns result instead of throwing
 * Use this when you want to handle conflicts in the UI
 */
export async function updateExpenseWithLock(
  id: string,
  formData: ExpenseFormData,
  expectedVersion: number,
  baseExpense: Expense
): Promise<UpdateResult<Expense>> {
  const supabase = await createClient();

  try {
    // Fetch current version from database
    const { data: currentExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return notFoundResult("Expense not found or has been deleted");
      }
      return unknownErrorResult(fetchError.message);
    }

    // Check if version matches
    if (currentExpense.version !== expectedVersion) {
      // Version mismatch - build local version from form data for comparison
      const totalAmount = formData.line_items.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const { category: primaryCategory, category_id: primaryCategoryId } =
        getPrimaryCategory(formData.line_items);

      const localExpense: Expense = {
        ...baseExpense,
        trip_id: formData.trip_id || null,
        vendor_id: formData.vendor_id || null,
        payment_method_id: formData.payment_method_id || null,
        category_id: primaryCategoryId,
        date: formData.date,
        vendor: formData.vendor,
        amount: totalAmount,
        category: primaryCategory,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      // Attempt auto-merge
      const mergeResult = attemptAutoMerge(
        baseExpense,
        localExpense,
        currentExpense,
        EXPENSE_CONFLICT_FIELDS
      );

      if (mergeResult.success) {
        // Auto-merge successful - apply the merged data
        const { error: updateError, data: updatedExpense } = await supabase
          .from("expenses")
          .update({
            trip_id: mergeResult.mergedData.trip_id,
            vendor_id: mergeResult.mergedData.vendor_id,
            payment_method_id: mergeResult.mergedData.payment_method_id,
            category_id: mergeResult.mergedData.category_id,
            date: mergeResult.mergedData.date,
            vendor: mergeResult.mergedData.vendor,
            amount: mergeResult.mergedData.amount,
            category: mergeResult.mergedData.category,
            payment_method: mergeResult.mergedData.payment_method,
            notes: mergeResult.mergedData.notes,
          })
          .eq("id", id)
          .eq("version", currentExpense.version) // Ensure no changes during merge
          .select()
          .single();

        if (updateError) {
          // Another concurrent update happened
          return unknownErrorResult(
            "Data changed during merge. Please try again."
          );
        }

        // Update line items
        await updateLineItems(supabase, id, formData.line_items);

        revalidatePath("/expenses");
        revalidatePath(`/expenses/${id}`);
        if (formData.trip_id) {
          revalidatePath(`/trips/${formData.trip_id}`);
        }

        return successResult(updatedExpense, updatedExpense.version);
      }

      // Auto-merge failed - return conflict data
      const updatedByInfo = currentExpense.updated_by
        ? await getUserDisplayInfo(currentExpense.updated_by)
        : null;

      const conflictData = createConflictData(
        baseExpense,
        localExpense,
        currentExpense,
        EXPENSE_CONFLICT_FIELDS,
        updatedByInfo,
        currentExpense.updated_at
      );

      return versionConflictResult(conflictData);
    }

    // Version matches - proceed with update
    const totalAmount = formData.line_items.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const { category: primaryCategory, category_id: primaryCategoryId } =
      getPrimaryCategory(formData.line_items);

    const { error: updateError, data: updatedExpense } = await supabase
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
        notes: formData.notes || null,
      })
      .eq("id", id)
      .eq("version", expectedVersion) // Optimistic lock
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        // No row updated - version changed between check and update
        return unknownErrorResult(
          "Data was modified by another user. Please refresh and try again."
        );
      }
      return unknownErrorResult(updateError.message);
    }

    // Update line items
    await updateLineItems(supabase, id, formData.line_items);

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    if (formData.trip_id) {
      revalidatePath(`/trips/${formData.trip_id}`);
    }

    return successResult(updatedExpense, updatedExpense.version);
  } catch (error) {
    return unknownErrorResult(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}

/**
 * Helper function to update line items for an expense
 */
async function updateLineItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expenseId: string,
  lineItems: ExpenseLineItemInput[]
): Promise<void> {
  // Delete existing line items
  const { error: deleteError } = await supabase
    .from("expense_line_items")
    .delete()
    .eq("expense_id", expenseId);

  if (deleteError) throw deleteError;

  // Insert new line items
  const lineItemsToInsert = lineItems.map((item, index) => ({
    expense_id: expenseId,
    category_id: item.category_id,
    description: item.description || null,
    category: item.category,
    amount: item.amount,
    quantity_gallons: item.quantity_gallons,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("expense_line_items")
    .insert(lineItemsToInsert);

  if (insertError) throw insertError;
}

/**
 * Force update expense - use when user chooses "keep mine" in conflict resolution
 */
export async function forceUpdateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<UpdateResult<Expense>> {
  const supabase = await createClient();

  try {
    const totalAmount = formData.line_items.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const { category: primaryCategory, category_id: primaryCategoryId } =
      getPrimaryCategory(formData.line_items);

    const { error: updateError, data: updatedExpense } = await supabase
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
        notes: formData.notes || null,
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return notFoundResult("Expense not found or has been deleted");
      }
      return unknownErrorResult(updateError.message);
    }

    await updateLineItems(supabase, id, formData.line_items);

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    if (formData.trip_id) {
      revalidatePath(`/trips/${formData.trip_id}`);
    }

    return successResult(updatedExpense, updatedExpense.version);
  } catch (error) {
    return unknownErrorResult(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}
