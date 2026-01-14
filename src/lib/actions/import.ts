"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFile, generateStoragePath } from "@/lib/r2/client";
import { parseReceiptFilename } from "@/lib/import/parsers/airplane-manager";
import type {
  ImportSource,
  ImportMetadata,
  ImportResult,
  ParsedTrip,
  EntityMapping,
  AircraftMapping,
} from "@/types/import";

// Receipt data serialized for server action transfer (base64 encoded)
export type SerializedReceiptData = {
  filename: string;
  dataBase64: string;
  contentType: string;
};

export type ImportData = {
  source: ImportSource;
  trips: ParsedTrip[];
  metadata: ImportMetadata;
  receipts?: SerializedReceiptData[];
  skipDuplicateTripNames?: string[];
};

/**
 * Execute the full import process
 */
export async function executeImport(data: ImportData): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const result: ImportResult = {
    success: false,
    sessionId: "",
    created: {
      vendors: 0,
      categories: 0,
      paymentMethods: 0,
      aircraft: 0,
      trips: 0,
      expenses: 0,
      lineItems: 0,
      receipts: 0,
    },
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Map to track expenses by their matching criteria for receipt linking
  // Key format: "date|tripNumber|icao" or "date|tripNumber|" (without icao)
  const expenseMatchMap = new Map<string, string>();

  // Create import session
  const { data: session, error: sessionError } = await supabase
    .from("import_sessions")
    .insert({
      user_id: user.id,
      source_type: data.source,
      status: "processing",
      total_records: data.trips.reduce(
        (sum, trip) =>
          sum +
          trip.expenses.reduce(
            (eSum, expense) => eSum + expense.lineItems.length,
            0
          ),
        0
      ),
      metadata: data.metadata as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (sessionError) {
    throw new Error(`Failed to create import session: ${sessionError.message}`);
  }

  result.sessionId = session.id;

  try {
    // Maps to track created entities by their source name
    const vendorIdMap = new Map<string, string>();
    const categoryIdMap = new Map<string, string>();
    const paymentMethodIdMap = new Map<string, string>();
    const aircraftIdMap = new Map<string, string>();

    // 1. Create/map vendors
    for (const [sourceName, mapping] of Object.entries(data.metadata.vendorMappings)) {
      const id = await processEntityMapping(
        supabase,
        "vendors",
        sourceName,
        mapping,
        { name: mapping.newName || sourceName }
      );
      if (id) vendorIdMap.set(sourceName, id);
      if (mapping.action === "create" && id) result.created.vendors++;
    }

    // 2. Create/map categories
    for (const [sourceName, mapping] of Object.entries(data.metadata.categoryMappings)) {
      const id = await processEntityMapping(
        supabase,
        "expense_categories",
        sourceName,
        mapping,
        {
          name: mapping.newName || sourceName,
          is_fuel_category: mapping.isFuelCategory || false,
        }
      );
      if (id) categoryIdMap.set(sourceName, id);
      if (mapping.action === "create" && id) result.created.categories++;
    }

    // 3. Create/map payment methods
    for (const [sourceName, mapping] of Object.entries(data.metadata.paymentMethodMappings)) {
      const id = await processEntityMapping(
        supabase,
        "payment_methods",
        sourceName,
        mapping,
        { name: mapping.newName || sourceName }
      );
      if (id) paymentMethodIdMap.set(sourceName, id);
      if (mapping.action === "create" && id) result.created.paymentMethods++;
    }

    // 4. Create/map aircraft
    for (const [tailNumber, mapping] of Object.entries(data.metadata.aircraftMappings)) {
      const id = await processAircraftMapping(supabase, tailNumber, mapping);
      if (id) aircraftIdMap.set(tailNumber, id);
      if (mapping.action === "create" && id) result.created.aircraft++;
    }

    // Build set of trip names to skip
    const skipTripNames = new Set(
      (data.skipDuplicateTripNames || []).map((name) => name.toLowerCase())
    );

    // 5. Create trips and expenses
    for (const trip of data.trips) {
      try {
        // Skip duplicate trips if requested
        if (skipTripNames.has(trip.name.toLowerCase())) {
          result.skipped++;
          continue;
        }

        const aircraftId = aircraftIdMap.get(trip.tailNumber);

        // Skip trips without aircraft if required
        if (!aircraftId && trip.tailNumber) {
          result.errors.push(`Trip ${trip.name}: No aircraft mapping for ${trip.tailNumber}`);
          result.skipped++;
          continue;
        }

        // Create trip (if it has expenses with trip numbers)
        let tripId: string | null = null;
        if (trip.tripNumber && aircraftId) {
          const { data: newTrip, error: tripError } = await supabase
            .from("trips")
            .insert({
              name: trip.name,
              start_date: trip.startDate,
              end_date: trip.endDate || null,
              aircraft_id: aircraftId,
              aircraft: trip.tailNumber,
            })
            .select()
            .single();

          if (tripError) {
            result.errors.push(`Trip ${trip.name}: ${tripError.message}`);
            result.failed++;
            continue;
          }

          tripId = newTrip.id;
          result.created.trips++;
        }

        // Create expenses
        for (const expense of trip.expenses) {
          try {
            const vendorId = vendorIdMap.get(expense.vendorName) || null;
            const paymentMethodId = paymentMethodIdMap.get(expense.paymentMethod) || null;

            // Calculate total amount and primary category
            const totalAmount = expense.lineItems.reduce(
              (sum, item) => sum + item.amount,
              0
            );
            const primaryCategory =
              expense.lineItems.length > 0
                ? expense.lineItems.reduce((max, item) =>
                    item.amount > max.amount ? item : max
                  )
                : null;

            const primaryCategoryId = primaryCategory
              ? categoryIdMap.get(primaryCategory.category) || null
              : null;

            const { data: newExpense, error: expenseError } = await supabase
              .from("expenses")
              .insert({
                trip_id: tripId,
                vendor_id: vendorId,
                payment_method_id: paymentMethodId,
                category_id: primaryCategoryId,
                date: expense.date,
                vendor: expense.vendorName,
                amount: totalAmount,
                category: primaryCategory?.category || "Other",
                payment_method: expense.paymentMethod || null,
                notes: expense.notes || null,
              })
              .select()
              .single();

            if (expenseError) {
              result.errors.push(
                `Expense ${expense.date} ${expense.vendorName}: ${expenseError.message}`
              );
              result.failed++;
              continue;
            }

            result.created.expenses++;

            // Track expense for receipt matching
            // Key format: "date|tripNumber|icao"
            for (const lineItem of expense.lineItems) {
              if (lineItem.icao) {
                const keyWithIcao = `${expense.date}|${expense.tripNumber}|${lineItem.icao}`;
                expenseMatchMap.set(keyWithIcao, newExpense.id);
              }
            }
            // Also add a key without ICAO for fallback matching
            if (expense.tripNumber) {
              const keyWithoutIcao = `${expense.date}|${expense.tripNumber}|`;
              expenseMatchMap.set(keyWithoutIcao, newExpense.id);
            }

            // Create line items
            const lineItemsToInsert = expense.lineItems.map((item, index) => ({
              expense_id: newExpense.id,
              category_id: categoryIdMap.get(item.category) || null,
              description: item.description || null,
              category: item.category,
              amount: item.amount,
              quantity_gallons: item.gallons,
              sort_order: index,
            }));

            const { error: lineItemsError } = await supabase
              .from("expense_line_items")
              .insert(lineItemsToInsert);

            if (lineItemsError) {
              result.errors.push(
                `Line items for expense ${expense.date}: ${lineItemsError.message}`
              );
            } else {
              result.created.lineItems += lineItemsToInsert.length;
            }

            // Log success
            await supabase.from("import_logs").insert({
              import_session_id: session.id,
              row_number: 0,
              status: "success",
              entity_type: "expense",
              entity_id: newExpense.id,
            });
          } catch (expenseErr) {
            result.errors.push(
              `Expense error: ${expenseErr instanceof Error ? expenseErr.message : "Unknown error"}`
            );
            result.failed++;
          }
        }
      } catch (tripErr) {
        result.errors.push(
          `Trip error: ${tripErr instanceof Error ? tripErr.message : "Unknown error"}`
        );
        result.failed++;
      }
    }

    // 6. Process receipts (if provided)
    if (data.receipts && data.receipts.length > 0) {
      for (const receipt of data.receipts) {
        try {
          // Parse filename to extract matching info
          const parsed = parseReceiptFilename(receipt.filename);
          if (!parsed) {
            result.errors.push(`Receipt ${receipt.filename}: Could not parse filename`);
            continue;
          }

          // Try to match to an expense
          const keyWithIcao = `${parsed.date}|${parsed.tripNumber}|${parsed.icao}`;
          const keyWithoutIcao = `${parsed.date}|${parsed.tripNumber}|`;

          const expenseId = expenseMatchMap.get(keyWithIcao) || expenseMatchMap.get(keyWithoutIcao);

          if (!expenseId) {
            // Not necessarily an error - receipt might be for an expense that failed to import
            continue;
          }

          // Decode base64 to Uint8Array
          const binaryString = atob(receipt.dataBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Generate storage path and upload to R2
          const storagePath = generateStoragePath(expenseId, receipt.filename);
          await uploadFile(storagePath, bytes, receipt.contentType);

          // Create receipt record in database
          const { error: receiptError } = await supabase.from("receipts").insert({
            expense_id: expenseId,
            storage_path: storagePath,
            original_filename: receipt.filename.split("/").pop() || receipt.filename,
            uploaded_by: user.id,
          });

          if (receiptError) {
            result.errors.push(`Receipt ${receipt.filename}: ${receiptError.message}`);
          } else {
            result.created.receipts++;
          }
        } catch (receiptErr) {
          result.errors.push(
            `Receipt error: ${receiptErr instanceof Error ? receiptErr.message : "Unknown error"}`
          );
        }
      }
    }

    // Update session status
    await supabase
      .from("import_sessions")
      .update({
        status: result.errors.length > 0 ? "completed" : "completed",
        processed_records:
          result.created.expenses + result.created.lineItems + result.created.receipts,
        failed_records: result.failed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    result.success = result.failed === 0;

    // Revalidate paths
    revalidatePath("/trips");
    revalidatePath("/expenses");
    revalidatePath("/vendors");
    revalidatePath("/expense-categories");
    revalidatePath("/payment-methods");
    revalidatePath("/aircraft");

    return result;
  } catch (error) {
    // Update session with error
    await supabase
      .from("import_sessions")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", session.id);

    throw error;
  }
}

/**
 * Process a single entity mapping (vendor, category, or payment method)
 */
async function processEntityMapping(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "vendors" | "expense_categories" | "payment_methods",
  sourceName: string,
  mapping: EntityMapping,
  createData: Record<string, unknown>
): Promise<string | null> {
  if (mapping.action === "skip") {
    return null;
  }

  // If mapping to existing, try targetId first, then lookup by name
  if (mapping.action === "map") {
    if (mapping.targetId) {
      return mapping.targetId;
    }
    // Lookup by name if no targetId provided
    const { data: existing } = await supabase
      .from(table)
      .select("id")
      .ilike("name", sourceName)
      .is("deleted_at", null)
      .single();
    if (existing) {
      return existing.id;
    }
  }

  if (mapping.action === "create") {
    // Check if already exists (case-insensitive)
    const { data: existing } = await supabase
      .from(table)
      .select("id")
      .ilike("name", createData.name as string)
      .is("deleted_at", null)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new
    const { data: created, error } = await supabase
      .from(table)
      .insert(createData)
      .select()
      .single();

    if (error) {
      console.error(`Failed to create ${table}:`, error);
      return null;
    }

    return created.id;
  }

  return null;
}

/**
 * Process aircraft mapping
 */
async function processAircraftMapping(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tailNumber: string,
  mapping: AircraftMapping
): Promise<string | null> {
  // If mapping to existing, try targetId first, then lookup by tail number
  if (mapping.action === "map") {
    if (mapping.targetId) {
      return mapping.targetId;
    }
    // Lookup by tail number if no targetId provided
    const { data: existing } = await supabase
      .from("aircraft")
      .select("id")
      .ilike("tail_number", tailNumber)
      .is("deleted_at", null)
      .single();
    if (existing) {
      return existing.id;
    }
  }

  if (mapping.action === "create") {
    // Check if already exists (case-insensitive)
    const { data: existing } = await supabase
      .from("aircraft")
      .select("id")
      .ilike("tail_number", tailNumber)
      .is("deleted_at", null)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new
    const { data: created, error } = await supabase
      .from("aircraft")
      .insert({
        tail_number: tailNumber.toUpperCase(),
        name: mapping.name || null,
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to create aircraft:`, error);
      return null;
    }

    return created.id;
  }

  return null;
}
