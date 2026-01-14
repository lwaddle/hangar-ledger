import Papa from "papaparse";
import type {
  AirplaneManagerRow,
  ParsedExpense,
  ParsedLineItem,
  ParsedTrip,
  ImportPreviewData,
  ValidationError,
} from "@/types/import";

// Known category mappings from Airplane Manager to common names
const KNOWN_FUEL_CATEGORIES = ["fuel", "avgas", "jet-a", "jet fuel"];

function isLikelyFuelCategory(category: string): boolean {
  const normalized = category.toLowerCase().trim();
  return KNOWN_FUEL_CATEGORIES.some((fuel) => normalized.includes(fuel));
}

// Check if a category value is actually a numeric ID (data quality issue)
function isCategoryIdValue(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

/**
 * Parse Airplane Manager CSV data
 */
export function parseAirplaneManagerCSV(csvContent: string): {
  rows: AirplaneManagerRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const result = Papa.parse<AirplaneManagerRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check for parse errors
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      errors.push({
        row: error.row ?? 0,
        field: "csv",
        value: "",
        message: error.message,
        severity: "error",
      });
    }
  }

  // Validate rows
  const rows = result.data;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Account for header row and 0-index

    // Required fields
    if (!row.DateOccurred) {
      errors.push({
        row: rowNum,
        field: "DateOccurred",
        value: "",
        message: "Missing date",
        severity: "error",
      });
    }

    if (!row.Amount) {
      errors.push({
        row: rowNum,
        field: "Amount",
        value: "",
        message: "Missing amount",
        severity: "error",
      });
    }

    // Warnings for data quality issues
    if (row.Category && isCategoryIdValue(row.Category)) {
      warnings.push({
        row: rowNum,
        field: "Category",
        value: row.Category,
        message: `Category appears to be an ID (${row.Category}) instead of a name`,
        severity: "warning",
      });
    }

    if (!row.TripNumber && !row.TailNumber) {
      warnings.push({
        row: rowNum,
        field: "TripNumber",
        value: "",
        message: "No trip or aircraft information - will be imported as standalone expense",
        severity: "warning",
      });
    }
  }

  return { rows, errors, warnings };
}

/**
 * Transform parsed rows into structured import data
 */
export function transformAirplaneManagerData(
  rows: AirplaneManagerRow[],
  existingCategories: { name: string; is_fuel_category: boolean }[],
  existingVendors: { name: string }[],
  existingPaymentMethods: { name: string }[],
  existingAircraft: { tail_number: string }[]
): ImportPreviewData {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Group rows by ExpenseID to form expenses with line items
  const expenseMap = new Map<string, AirplaneManagerRow[]>();
  for (const row of rows) {
    const expenseId = row.ExpenseID || `standalone-${row.DateOccurred}-${row.VendorName}`;
    const existing = expenseMap.get(expenseId) || [];
    existing.push(row);
    expenseMap.set(expenseId, existing);
  }

  // Build parsed expenses
  const parsedExpenses: ParsedExpense[] = [];
  for (const [expenseId, expenseRows] of expenseMap) {
    const firstRow = expenseRows[0];

    const lineItems: ParsedLineItem[] = expenseRows.map((row) => ({
      sourceItemId: row.ExpenseItemID,
      category: isCategoryIdValue(row.Category) ? "Unknown" : row.Category || "Other",
      categoryId: row.CategoryID,
      amount: parseFloat(row.Amount) || 0,
      gallons: row.Gallons ? parseFloat(row.Gallons) : null,
      description: row.Notes || "",
      icao: row.ICAO || "",
    }));

    parsedExpenses.push({
      sourceExpenseId: expenseId,
      date: firstRow.DateOccurred,
      vendorName: firstRow.VendorName || "Unknown Vendor",
      vendorId: firstRow.VendorID || null,
      tripNumber: firstRow.TripNumber,
      tripFlightId: firstRow.FlightID,
      tailNumber: firstRow.TailNumber,
      paymentMethod: firstRow.PaymentMethod || "",
      notes: firstRow.Notes || "",
      lineItems,
    });
  }

  // Group expenses by trip
  const tripMap = new Map<string, ParsedExpense[]>();
  const standAloneExpenses: ParsedExpense[] = [];

  for (const expense of parsedExpenses) {
    if (expense.tripNumber) {
      const existing = tripMap.get(expense.tripNumber) || [];
      existing.push(expense);
      tripMap.set(expense.tripNumber, existing);
    } else {
      standAloneExpenses.push(expense);
    }
  }

  // Build parsed trips
  const parsedTrips: ParsedTrip[] = [];
  for (const [tripNumber, tripExpenses] of tripMap) {
    const dates = tripExpenses.map((e) => e.date).sort();
    const tailNumbers = [...new Set(tripExpenses.map((e) => e.tailNumber).filter(Boolean))];
    const flightIds = [...new Set(tripExpenses.map((e) => e.tripFlightId).filter(Boolean))];

    parsedTrips.push({
      tripNumber,
      name: `Trip ${tripNumber}`,
      flightIds,
      tailNumber: tailNumbers[0] || "",
      startDate: dates[0] || "",
      endDate: dates[dates.length - 1] || "",
      expenses: tripExpenses,
    });
  }

  // Add standalone expenses as a "General" trip if any exist
  if (standAloneExpenses.length > 0) {
    warnings.push(
      `${standAloneExpenses.length} expenses have no trip information and will be imported without a trip association`
    );
  }

  // Extract unique entities
  const uniqueCategoryNames = new Set<string>();
  const uniqueVendorNames = new Set<string>();
  const uniquePaymentMethodNames = new Set<string>();
  const uniqueTailNumbers = new Set<string>();

  for (const expense of parsedExpenses) {
    if (expense.vendorName) uniqueVendorNames.add(expense.vendorName);
    if (expense.paymentMethod) uniquePaymentMethodNames.add(expense.paymentMethod);
    if (expense.tailNumber) uniqueTailNumbers.add(expense.tailNumber);
    for (const item of expense.lineItems) {
      if (item.category) uniqueCategoryNames.add(item.category);
    }
  }

  // Check which entities already exist (case-insensitive)
  const existingCategoryNamesLower = new Set(
    existingCategories.map((c) => c.name.toLowerCase())
  );
  const existingVendorNamesLower = new Set(
    existingVendors.map((v) => v.name.toLowerCase())
  );
  const existingPaymentMethodNamesLower = new Set(
    existingPaymentMethods.map((p) => p.name.toLowerCase())
  );
  const existingAircraftTailNumbers = new Set(
    existingAircraft.map((a) => a.tail_number.toUpperCase())
  );

  const uniqueCategories = [...uniqueCategoryNames].map((name) => ({
    name,
    exists: existingCategoryNamesLower.has(name.toLowerCase()),
    isFuel: isLikelyFuelCategory(name),
  }));

  const uniqueVendors = [...uniqueVendorNames].map((name) => ({
    name,
    exists: existingVendorNamesLower.has(name.toLowerCase()),
  }));

  const uniquePaymentMethods = [...uniquePaymentMethodNames].map((name) => ({
    name,
    exists: existingPaymentMethodNamesLower.has(name.toLowerCase()),
  }));

  const uniqueAircraft = [...uniqueTailNumbers].map((tailNumber) => ({
    tailNumber,
    exists: existingAircraftTailNumbers.has(tailNumber.toUpperCase()),
  }));

  // Count totals
  let totalLineItems = 0;
  for (const expense of parsedExpenses) {
    totalLineItems += expense.lineItems.length;
  }

  return {
    source: "airplane_manager",
    aircraft: uniqueAircraft,
    trips: parsedTrips,
    uniqueCategories,
    uniqueVendors,
    uniquePaymentMethods,
    totalExpenses: parsedExpenses.length,
    totalLineItems,
    receiptCount: 0, // Will be populated when processing ZIP
    warnings,
    errors,
    rawData: rows,
  };
}

export type ReceiptFileData = {
  filename: string;
  data: Uint8Array;
  contentType: string;
};

/**
 * Extract CSV content from a ZIP file
 */
export async function extractCSVFromZip(
  file: File
): Promise<{ csv: string; receiptFiles: string[] }> {
  // Dynamically import JSZip to keep it client-side only
  const JSZip = (await import("jszip")).default;

  const zip = await JSZip.loadAsync(file);

  let csvContent = "";
  const receiptFiles: string[] = [];

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith(".csv")) {
      csvContent = await zipEntry.async("string");
    } else if (
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png")
    ) {
      receiptFiles.push(filename);
    }
  }

  if (!csvContent) {
    throw new Error("No CSV file found in the ZIP archive");
  }

  return { csv: csvContent, receiptFiles };
}

/**
 * Extract receipt files with their binary data from ZIP
 */
export async function extractReceiptFilesFromZip(
  file: File
): Promise<ReceiptFileData[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const receipts: ReceiptFileData[] = [];

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    const lowerName = filename.toLowerCase();
    let contentType = "";

    if (lowerName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (lowerName.endsWith(".png")) {
      contentType = "image/png";
    }

    if (contentType) {
      const data = await zipEntry.async("uint8array");
      receipts.push({ filename, data, contentType });
    }
  }

  return receipts;
}

/**
 * Parse receipt filename to extract matching info
 * Format: "2025-01-05 N491JL 322077 KAUS UploadID-1187369 FlightID-789177.pdf"
 */
export function parseReceiptFilename(filename: string): {
  date: string;
  tailNumber: string;
  tripNumber: string;
  icao: string;
} | null {
  // Remove path if present
  const basename = filename.split("/").pop() || filename;

  // Pattern: date tail tripNumber icao ...
  const match = basename.match(/^(\d{4}-\d{2}-\d{2})\s+(\w+)\s+(\d+)\s+(\w*)/);
  if (!match) return null;

  const [, date, tailNumber, tripNumber, icao] = match;
  return { date, tailNumber, tripNumber, icao: icao || "" };
}
