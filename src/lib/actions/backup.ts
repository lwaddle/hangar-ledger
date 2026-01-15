"use server";

import { revalidatePath } from "next/cache";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { downloadFile, uploadFile, generateStoragePath } from "@/lib/r2/client";
import type {
  BackupManifest,
  BackupExpense,
  BackupLineItem,
  BackupTrip,
  BackupAircraft,
  BackupVendor,
  BackupCategory,
  BackupPaymentMethod,
  RestoreResult,
} from "@/types/backup";

const CURRENT_BACKUP_VERSION = 1;

type ReceiptRow = {
  id: string;
  expense_id: string;
  storage_path: string;
  original_filename: string | null;
  uploaded_at: string;
};

/**
 * Generate a complete backup as a ZIP file containing all data and receipts
 * Returns base64-encoded ZIP content for client-side download
 */
export async function generateBackup(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch all data in parallel
  const [
    { data: aircraft },
    { data: vendors },
    { data: categories },
    { data: paymentMethods },
    { data: trips },
    { data: expenses },
    { data: lineItems },
    { data: receipts },
  ] = await Promise.all([
    supabase
      .from("aircraft")
      .select("*")
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("vendors")
      .select("*")
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("expense_categories")
      .select("*")
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("payment_methods")
      .select("*")
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("trips")
      .select("*")
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("expenses")
      .select("*")
      .is("deleted_at", null)
      .order("created_at"),
    supabase.from("expense_line_items").select("*").order("created_at"),
    supabase.from("receipts").select("*").order("uploaded_at"),
  ]);

  // Group receipts by expense_id for easier lookup
  const receiptsByExpense = new Map<string, ReceiptRow[]>();
  for (const receipt of (receipts ?? []) as ReceiptRow[]) {
    const existing = receiptsByExpense.get(receipt.expense_id) ?? [];
    existing.push(receipt);
    receiptsByExpense.set(receipt.expense_id, existing);
  }

  // Filter line items to only include those for non-deleted expenses
  const expenseIds = new Set((expenses ?? []).map((e) => e.id));
  const filteredLineItems = (lineItems ?? []).filter((li) =>
    expenseIds.has(li.expense_id)
  );

  // Transform data to backup format
  const backupAircraft: BackupAircraft[] = (aircraft ?? []).map((a) => ({
    id: a.id,
    tailNumber: a.tail_number,
    name: a.name,
    notes: a.notes,
    isActive: a.is_active,
    createdAt: a.created_at,
  }));

  const backupVendors: BackupVendor[] = (vendors ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    notes: v.notes,
    isActive: v.is_active,
    createdAt: v.created_at,
  }));

  const backupCategories: BackupCategory[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    isSystem: c.is_system,
    isActive: c.is_active,
    isFuelCategory: c.is_fuel_category,
    isDefault: c.is_default ?? false,
    notes: c.notes,
    createdAt: c.created_at,
  }));

  const backupPaymentMethods: BackupPaymentMethod[] = (paymentMethods ?? []).map(
    (pm) => ({
      id: pm.id,
      name: pm.name,
      notes: pm.notes,
      isActive: pm.is_active,
      createdAt: pm.created_at,
    })
  );

  const backupTrips: BackupTrip[] = (trips ?? []).map((t) => ({
    id: t.id,
    aircraftId: t.aircraft_id,
    tripNumber: t.trip_number,
    name: t.name,
    startDate: t.start_date,
    endDate: t.end_date,
    notes: t.notes,
    createdAt: t.created_at,
  }));

  const backupExpenses: BackupExpense[] = (expenses ?? []).map((e) => {
    const expenseReceipts = receiptsByExpense.get(e.id) ?? [];
    return {
      id: e.id,
      tripId: e.trip_id,
      vendorId: e.vendor_id,
      paymentMethodId: e.payment_method_id,
      categoryId: e.category_id,
      date: e.date,
      vendor: e.vendor,
      amount: e.amount,
      category: e.category,
      paymentMethod: e.payment_method,
      notes: e.notes,
      createdAt: e.created_at,
      receipts: expenseReceipts.map((r) => {
        const ext = getFileExtension(r.storage_path);
        return {
          id: r.id,
          filename: `${r.id}${ext}`,
          originalFilename: r.original_filename ?? `receipt${ext}`,
          storagePath: r.storage_path,
        };
      }),
    };
  });

  const backupLineItems: BackupLineItem[] = filteredLineItems.map((li) => ({
    id: li.id,
    expenseId: li.expense_id,
    categoryId: li.category_id,
    description: li.description,
    category: li.category,
    amount: li.amount,
    quantityGallons: li.quantity_gallons,
    sortOrder: li.sort_order,
    createdAt: li.created_at,
  }));

  // Count total receipts
  let totalReceipts = 0;
  for (const expense of backupExpenses) {
    totalReceipts += expense.receipts.length;
  }

  // Create manifest
  const manifest: BackupManifest = {
    version: CURRENT_BACKUP_VERSION,
    appVersion: "1.0.0",
    createdAt: new Date().toISOString(),
    userId: user.id,
    counts: {
      aircraft: backupAircraft.length,
      vendors: backupVendors.length,
      categories: backupCategories.length,
      paymentMethods: backupPaymentMethods.length,
      trips: backupTrips.length,
      expenses: backupExpenses.length,
      lineItems: backupLineItems.length,
      receipts: totalReceipts,
    },
  };

  // Create ZIP file
  const zip = new JSZip();

  // Add manifest
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Add data files
  const dataFolder = zip.folder("data");
  if (dataFolder) {
    dataFolder.file("aircraft.json", JSON.stringify(backupAircraft, null, 2));
    dataFolder.file("vendors.json", JSON.stringify(backupVendors, null, 2));
    dataFolder.file("categories.json", JSON.stringify(backupCategories, null, 2));
    dataFolder.file(
      "payment-methods.json",
      JSON.stringify(backupPaymentMethods, null, 2)
    );
    dataFolder.file("trips.json", JSON.stringify(backupTrips, null, 2));
    dataFolder.file("expenses.json", JSON.stringify(backupExpenses, null, 2));
    dataFolder.file("line-items.json", JSON.stringify(backupLineItems, null, 2));
  }

  // Download and add receipt files
  const receiptsFolder = zip.folder("receipts");
  if (receiptsFolder && totalReceipts > 0) {
    for (const expense of backupExpenses) {
      for (const receipt of expense.receipts) {
        const fileData = await downloadFile(receipt.storagePath);
        if (fileData) {
          receiptsFolder.file(receipt.filename, fileData);
        }
      }
    }
  }

  // Generate ZIP as base64
  const zipContent = await zip.generateAsync({ type: "base64" });
  return zipContent;
}

/**
 * Restore data from a backup ZIP file
 * Skips duplicates based on ID matching
 */
export async function restoreBackup(
  zipBase64: string
): Promise<RestoreResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const result: RestoreResult = {
    success: false,
    created: {
      aircraft: 0,
      vendors: 0,
      categories: 0,
      paymentMethods: 0,
      trips: 0,
      expenses: 0,
      lineItems: 0,
      receipts: 0,
    },
    skipped: {
      aircraft: 0,
      vendors: 0,
      categories: 0,
      paymentMethods: 0,
      trips: 0,
      expenses: 0,
      lineItems: 0,
      receipts: 0,
    },
    errors: [],
  };

  // Parse ZIP file
  const zip = new JSZip();
  const zipData = await zip.loadAsync(zipBase64, { base64: true });

  // Read and validate manifest
  const manifestFile = zipData.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Invalid backup: missing manifest.json");
  }

  const manifestContent = await manifestFile.async("string");
  const manifest: BackupManifest = JSON.parse(manifestContent);

  if (manifest.version > CURRENT_BACKUP_VERSION) {
    throw new Error(
      `Backup version ${manifest.version} is newer than supported version ${CURRENT_BACKUP_VERSION}`
    );
  }

  // Read data files
  const dataFolder = zipData.folder("data");
  if (!dataFolder) {
    throw new Error("Invalid backup: missing data folder");
  }

  const readJsonFile = async <T>(filename: string): Promise<T[]> => {
    const file = dataFolder.file(filename);
    if (!file) return [];
    const content = await file.async("string");
    return JSON.parse(content);
  };

  const backupAircraft = await readJsonFile<BackupAircraft>("aircraft.json");
  const backupVendors = await readJsonFile<BackupVendor>("vendors.json");
  const backupCategories = await readJsonFile<BackupCategory>("categories.json");
  const backupPaymentMethods = await readJsonFile<BackupPaymentMethod>(
    "payment-methods.json"
  );
  const backupTrips = await readJsonFile<BackupTrip>("trips.json");
  const backupExpenses = await readJsonFile<BackupExpense>("expenses.json");
  const backupLineItems = await readJsonFile<BackupLineItem>("line-items.json");

  // Get existing IDs from database
  const [
    { data: existingAircraft },
    { data: existingVendors },
    { data: existingCategories },
    { data: existingPaymentMethods },
    { data: existingTrips },
    { data: existingExpenses },
    { data: existingLineItems },
    { data: existingReceipts },
  ] = await Promise.all([
    supabase.from("aircraft").select("id"),
    supabase.from("vendors").select("id"),
    supabase.from("expense_categories").select("id"),
    supabase.from("payment_methods").select("id"),
    supabase.from("trips").select("id"),
    supabase.from("expenses").select("id"),
    supabase.from("expense_line_items").select("id"),
    supabase.from("receipts").select("id"),
  ]);

  const existingIds = {
    aircraft: new Set((existingAircraft ?? []).map((a) => a.id)),
    vendors: new Set((existingVendors ?? []).map((v) => v.id)),
    categories: new Set((existingCategories ?? []).map((c) => c.id)),
    paymentMethods: new Set((existingPaymentMethods ?? []).map((pm) => pm.id)),
    trips: new Set((existingTrips ?? []).map((t) => t.id)),
    expenses: new Set((existingExpenses ?? []).map((e) => e.id)),
    lineItems: new Set((existingLineItems ?? []).map((li) => li.id)),
    receipts: new Set((existingReceipts ?? []).map((r) => r.id)),
  };

  // 1. Restore aircraft
  for (const aircraft of backupAircraft) {
    if (existingIds.aircraft.has(aircraft.id)) {
      result.skipped.aircraft++;
      continue;
    }
    try {
      const { error } = await supabase.from("aircraft").insert({
        id: aircraft.id,
        tail_number: aircraft.tailNumber,
        name: aircraft.name,
        notes: aircraft.notes,
        is_active: aircraft.isActive,
        created_at: aircraft.createdAt,
      });
      if (error) throw error;
      result.created.aircraft++;
    } catch (err) {
      result.errors.push(
        `Aircraft ${aircraft.tailNumber}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 2. Restore vendors
  for (const vendor of backupVendors) {
    if (existingIds.vendors.has(vendor.id)) {
      result.skipped.vendors++;
      continue;
    }
    try {
      const { error } = await supabase.from("vendors").insert({
        id: vendor.id,
        name: vendor.name,
        notes: vendor.notes,
        is_active: vendor.isActive,
        created_at: vendor.createdAt,
      });
      if (error) throw error;
      result.created.vendors++;
    } catch (err) {
      result.errors.push(
        `Vendor ${vendor.name}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 3. Restore categories
  for (const category of backupCategories) {
    if (existingIds.categories.has(category.id)) {
      result.skipped.categories++;
      continue;
    }
    try {
      const { error } = await supabase.from("expense_categories").insert({
        id: category.id,
        name: category.name,
        is_system: category.isSystem,
        is_active: category.isActive,
        is_fuel_category: category.isFuelCategory,
        is_default: category.isDefault,
        notes: category.notes,
        created_at: category.createdAt,
      });
      if (error) throw error;
      result.created.categories++;
    } catch (err) {
      result.errors.push(
        `Category ${category.name}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 4. Restore payment methods
  for (const paymentMethod of backupPaymentMethods) {
    if (existingIds.paymentMethods.has(paymentMethod.id)) {
      result.skipped.paymentMethods++;
      continue;
    }
    try {
      const { error } = await supabase.from("payment_methods").insert({
        id: paymentMethod.id,
        name: paymentMethod.name,
        notes: paymentMethod.notes,
        is_active: paymentMethod.isActive,
        created_at: paymentMethod.createdAt,
      });
      if (error) throw error;
      result.created.paymentMethods++;
    } catch (err) {
      result.errors.push(
        `Payment method ${paymentMethod.name}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 5. Restore trips
  for (const trip of backupTrips) {
    if (existingIds.trips.has(trip.id)) {
      result.skipped.trips++;
      continue;
    }
    try {
      // Get aircraft tail number for denormalized field
      const aircraft = backupAircraft.find((a) => a.id === trip.aircraftId);
      const { error } = await supabase.from("trips").insert({
        id: trip.id,
        aircraft_id: trip.aircraftId,
        trip_number: trip.tripNumber,
        name: trip.name,
        start_date: trip.startDate,
        end_date: trip.endDate,
        aircraft: aircraft?.tailNumber ?? "",
        notes: trip.notes,
        created_at: trip.createdAt,
      });
      if (error) throw error;
      result.created.trips++;
    } catch (err) {
      result.errors.push(
        `Trip ${trip.name}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 6. Restore expenses
  const createdExpenseIds = new Set<string>();
  for (const expense of backupExpenses) {
    if (existingIds.expenses.has(expense.id)) {
      result.skipped.expenses++;
      continue;
    }
    try {
      const { error } = await supabase.from("expenses").insert({
        id: expense.id,
        trip_id: expense.tripId,
        vendor_id: expense.vendorId,
        payment_method_id: expense.paymentMethodId,
        category_id: expense.categoryId,
        date: expense.date,
        vendor: expense.vendor,
        amount: expense.amount,
        category: expense.category,
        payment_method: expense.paymentMethod,
        notes: expense.notes,
        created_at: expense.createdAt,
      });
      if (error) throw error;
      createdExpenseIds.add(expense.id);
      result.created.expenses++;
    } catch (err) {
      result.errors.push(
        `Expense ${expense.date} ${expense.vendor}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 7. Restore line items
  for (const lineItem of backupLineItems) {
    if (existingIds.lineItems.has(lineItem.id)) {
      result.skipped.lineItems++;
      continue;
    }
    // Skip if parent expense doesn't exist and wasn't created in this restore
    if (
      !existingIds.expenses.has(lineItem.expenseId) &&
      !createdExpenseIds.has(lineItem.expenseId)
    ) {
      continue;
    }
    try {
      const { error } = await supabase.from("expense_line_items").insert({
        id: lineItem.id,
        expense_id: lineItem.expenseId,
        category_id: lineItem.categoryId,
        description: lineItem.description,
        category: lineItem.category,
        amount: lineItem.amount,
        quantity_gallons: lineItem.quantityGallons,
        sort_order: lineItem.sortOrder,
        created_at: lineItem.createdAt,
      });
      if (error) throw error;
      result.created.lineItems++;
    } catch (err) {
      result.errors.push(
        `Line item: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  // 8. Restore receipts
  const receiptsFolder = zipData.folder("receipts");
  for (const expense of backupExpenses) {
    for (const receipt of expense.receipts) {
      if (existingIds.receipts.has(receipt.id)) {
        result.skipped.receipts++;
        continue;
      }
      // Skip if parent expense doesn't exist and wasn't created in this restore
      if (!existingIds.expenses.has(expense.id) && !createdExpenseIds.has(expense.id)) {
        continue;
      }
      try {
        // Get file from ZIP
        const receiptFile = receiptsFolder?.file(receipt.filename);
        if (!receiptFile) {
          result.errors.push(`Receipt file not found: ${receipt.filename}`);
          continue;
        }

        const fileData = await receiptFile.async("uint8array");

        // Determine content type from extension
        const ext = getFileExtension(receipt.filename).toLowerCase();
        const contentType = getContentType(ext);

        // Generate new storage path and upload
        const storagePath = generateStoragePath(expense.id, receipt.originalFilename);
        await uploadFile(storagePath, fileData, contentType);

        // Create receipt record
        const { error } = await supabase.from("receipts").insert({
          id: receipt.id,
          expense_id: expense.id,
          storage_path: storagePath,
          original_filename: receipt.originalFilename,
          uploaded_by: user.id,
        });

        if (error) throw error;
        result.created.receipts++;
      } catch (err) {
        result.errors.push(
          `Receipt ${receipt.originalFilename}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  }

  result.success = result.errors.length === 0;

  // Revalidate paths
  revalidatePath("/trips");
  revalidatePath("/expenses");
  revalidatePath("/vendors");
  revalidatePath("/expense-categories");
  revalidatePath("/payment-methods");
  revalidatePath("/aircraft");

  return result;
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.substring(lastDot);
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  return types[ext] || "application/octet-stream";
}
