"use server";

import { createClient } from "@/lib/supabase/server";

export type ExportRow = {
  date: string;
  trip_name: string;
  trip_start_date: string;
  trip_end_date: string;
  aircraft_tail_number: string;
  vendor_name: string;
  category_name: string;
  amount: string;
  gallons: string;
  payment_method: string;
  notes: string;
};

type ExpenseWithRelations = {
  id: string;
  date: string;
  vendor: string;
  payment_method: string | null;
  notes: string | null;
  trips: {
    name: string;
    start_date: string;
    end_date: string | null;
    aircraft: string;
  } | null;
  expense_line_items: {
    category: string;
    amount: number;
    quantity_gallons: number | null;
    description: string | null;
    sort_order: number;
  }[];
};

/**
 * Export all expenses to CSV format
 * Returns CSV as a string for client-side download
 */
export async function exportExpensesToCSV(): Promise<string> {
  const supabase = await createClient();

  // Fetch all expenses with their line items and related data
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      id,
      date,
      vendor,
      payment_method,
      notes,
      trips (
        name,
        start_date,
        end_date,
        aircraft
      ),
      expense_line_items (
        category,
        amount,
        quantity_gallons,
        description,
        sort_order
      )
    `
    )
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;

  const expenses = data as unknown as ExpenseWithRelations[];

  // CSV headers
  const headers = [
    "date",
    "trip_name",
    "trip_start_date",
    "trip_end_date",
    "aircraft_tail_number",
    "vendor_name",
    "category_name",
    "amount",
    "gallons",
    "payment_method",
    "notes",
  ];

  // Build CSV rows - one row per line item
  const rows: string[][] = [];

  for (const expense of expenses ?? []) {
    const trip = expense.trips;
    const lineItems = (expense.expense_line_items ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    );

    // If no line items, still create one row for the expense
    if (lineItems.length === 0) {
      rows.push([
        expense.date,
        trip?.name ?? "",
        trip?.start_date ?? "",
        trip?.end_date ?? "",
        trip?.aircraft ?? "",
        expense.vendor,
        "",
        "0",
        "",
        expense.payment_method ?? "",
        expense.notes ?? "",
      ]);
    } else {
      // One row per line item
      for (const lineItem of lineItems) {
        rows.push([
          expense.date,
          trip?.name ?? "",
          trip?.start_date ?? "",
          trip?.end_date ?? "",
          trip?.aircraft ?? "",
          expense.vendor,
          lineItem.category,
          lineItem.amount.toString(),
          lineItem.quantity_gallons?.toString() ?? "",
          expense.payment_method ?? "",
          lineItem.description ?? expense.notes ?? "",
        ]);
      }
    }
  }

  // Escape CSV fields (handle commas, quotes, newlines)
  const escapeField = (field: string): string => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  // Build CSV string
  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeField).join(",")),
  ];

  return csvLines.join("\n");
}

/**
 * Generate a CSV template for import with headers and one example row
 */
export async function generateImportTemplate(): Promise<string> {
  const headers = [
    "date",
    "trip_name",
    "aircraft_tail_number",
    "vendor_name",
    "category_name",
    "amount",
    "gallons",
    "payment_method",
    "notes",
  ];

  // Example row showing expected format
  const exampleRow = [
    "2024-01-15",
    "Trip to KLAS",
    "N12345",
    "Atlantic Aviation",
    "Fuel",
    "1250.00",
    "200.5",
    "Credit Card",
    "Fuel stop on way to Vegas",
  ];

  const csvLines = [headers.join(","), exampleRow.join(",")];

  return csvLines.join("\n");
}
