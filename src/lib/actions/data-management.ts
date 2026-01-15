"use server";

import { createClient } from "@/lib/supabase/server";
import { deleteObject } from "@/lib/r2/client";
import { revalidatePath } from "next/cache";

export type DeleteAllDataResult = {
  success: boolean;
  error?: string;
};

export async function deleteAllData(): Promise<DeleteAllDataResult> {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    // STEP 1: Get all receipt storage paths BEFORE deleting anything
    const { data: receipts, error: receiptsQueryError } = await supabase
      .from("receipts")
      .select("id, storage_path");

    if (receiptsQueryError) {
      return {
        success: false,
        error: `Failed to query receipts: ${receiptsQueryError.message}`,
      };
    }

    // STEP 2: Delete R2 files first
    // Use Promise.allSettled to continue even if some deletions fail
    if (receipts && receipts.length > 0) {
      const r2DeleteResults = await Promise.allSettled(
        receipts.map((receipt) => deleteObject(receipt.storage_path))
      );

      // Log any R2 deletion failures but don't stop the process
      const r2Failures = r2DeleteResults.filter((r) => r.status === "rejected");
      if (r2Failures.length > 0) {
        console.warn(`Failed to delete ${r2Failures.length} R2 files`);
      }
    }

    // STEP 3: Delete receipts from database
    const { error: receiptsDeleteError } = await supabase
      .from("receipts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (receiptsDeleteError) {
      return {
        success: false,
        error: `Failed to delete receipts: ${receiptsDeleteError.message}`,
      };
    }

    // STEP 4: Delete expense_line_items
    const { error: lineItemsError } = await supabase
      .from("expense_line_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (lineItemsError) {
      return {
        success: false,
        error: `Failed to delete line items: ${lineItemsError.message}`,
      };
    }

    // STEP 5: Delete expenses (hard delete)
    const { error: expensesError } = await supabase
      .from("expenses")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (expensesError) {
      return {
        success: false,
        error: `Failed to delete expenses: ${expensesError.message}`,
      };
    }

    // STEP 6: Delete trips (hard delete)
    const { error: tripsError } = await supabase
      .from("trips")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (tripsError) {
      return {
        success: false,
        error: `Failed to delete trips: ${tripsError.message}`,
      };
    }

    // STEP 7: Delete import_logs
    const { error: importLogsError } = await supabase
      .from("import_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (importLogsError) {
      return {
        success: false,
        error: `Failed to delete import logs: ${importLogsError.message}`,
      };
    }

    // STEP 8: Delete import_sessions
    const { error: importSessionsError } = await supabase
      .from("import_sessions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (importSessionsError) {
      return {
        success: false,
        error: `Failed to delete import sessions: ${importSessionsError.message}`,
      };
    }

    // STEP 9: Delete vendors (hard delete)
    const { error: vendorsError } = await supabase
      .from("vendors")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (vendorsError) {
      return {
        success: false,
        error: `Failed to delete vendors: ${vendorsError.message}`,
      };
    }

    // STEP 10: Delete payment_methods (hard delete)
    const { error: paymentMethodsError } = await supabase
      .from("payment_methods")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (paymentMethodsError) {
      return {
        success: false,
        error: `Failed to delete payment methods: ${paymentMethodsError.message}`,
      };
    }

    // STEP 11: Delete aircraft (hard delete)
    const { error: aircraftError } = await supabase
      .from("aircraft")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (aircraftError) {
      return {
        success: false,
        error: `Failed to delete aircraft: ${aircraftError.message}`,
      };
    }

    // STEP 12: Delete expense_categories WHERE is_default = false (preserve default categories)
    const { error: categoriesError } = await supabase
      .from("expense_categories")
      .delete()
      .eq("is_default", false);

    if (categoriesError) {
      return {
        success: false,
        error: `Failed to delete expense categories: ${categoriesError.message}`,
      };
    }

    // Revalidate all paths to reflect the deletion
    revalidatePath("/");
    revalidatePath("/trips");
    revalidatePath("/expenses");
    revalidatePath("/vendors");
    revalidatePath("/payment-methods");
    revalidatePath("/aircraft");
    revalidatePath("/expense-categories");
    revalidatePath("/settings");
    revalidatePath("/settings/import-export");

    return { success: true };
  } catch (error) {
    console.error("deleteAllData error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
