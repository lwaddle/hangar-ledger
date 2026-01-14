import Papa from "papaparse";
import type {
  HangarLedgerTemplateRow,
  ParsedExpense,
  ParsedLineItem,
  ParsedTrip,
  ImportPreviewData,
  ValidationError,
} from "@/types/import";

const FUEL_CATEGORIES = ["fuel", "avgas", "jet-a", "jet fuel"];

function isLikelyFuelCategory(category: string): boolean {
  const normalized = category.toLowerCase().trim();
  return FUEL_CATEGORIES.some((fuel) => normalized.includes(fuel));
}

/**
 * Parse Hangar Ledger template CSV data
 */
export function parseHangarLedgerCSV(csvContent: string): {
  rows: HangarLedgerTemplateRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const result = Papa.parse<HangarLedgerTemplateRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
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
    if (!row.date) {
      errors.push({
        row: rowNum,
        field: "date",
        value: "",
        message: "Missing date",
        severity: "error",
      });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      errors.push({
        row: rowNum,
        field: "date",
        value: row.date,
        message: "Invalid date format (expected YYYY-MM-DD)",
        severity: "error",
      });
    }

    if (!row.amount) {
      errors.push({
        row: rowNum,
        field: "amount",
        value: "",
        message: "Missing amount",
        severity: "error",
      });
    } else if (isNaN(parseFloat(row.amount))) {
      errors.push({
        row: rowNum,
        field: "amount",
        value: row.amount,
        message: "Invalid amount (must be a number)",
        severity: "error",
      });
    }

    if (!row.vendor_name) {
      warnings.push({
        row: rowNum,
        field: "vendor_name",
        value: "",
        message: "Missing vendor name",
        severity: "warning",
      });
    }

    if (!row.category_name) {
      warnings.push({
        row: rowNum,
        field: "category_name",
        value: "",
        message: "Missing category name - will use 'Other'",
        severity: "warning",
      });
    }

    // Validate gallons if present
    if (row.gallons && isNaN(parseFloat(row.gallons))) {
      errors.push({
        row: rowNum,
        field: "gallons",
        value: row.gallons,
        message: "Invalid gallons value (must be a number)",
        severity: "error",
      });
    }
  }

  return { rows, errors, warnings };
}

/**
 * Transform parsed CSV rows into structured import data
 */
export function transformHangarLedgerData(
  rows: HangarLedgerTemplateRow[],
  existingCategories: { name: string; is_fuel_category: boolean }[],
  existingVendors: { name: string }[],
  existingPaymentMethods: { name: string }[],
  existingAircraft: { tail_number: string }[]
): ImportPreviewData {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Group rows by trip name and date to form logical expenses
  // For simplicity, each row becomes its own expense with a single line item
  const parsedExpenses: ParsedExpense[] = rows.map((row, index) => {
    const lineItem: ParsedLineItem = {
      sourceItemId: `line-${index}`,
      category: row.category_name || "Other",
      categoryId: "",
      amount: parseFloat(row.amount) || 0,
      gallons: row.gallons ? parseFloat(row.gallons) : null,
      description: row.notes || "",
      icao: "",
    };

    return {
      sourceExpenseId: `expense-${index}`,
      date: row.date,
      vendorName: row.vendor_name || "Unknown Vendor",
      vendorId: null,
      tripNumber: row.trip_name || "",
      tripFlightId: "",
      tailNumber: row.aircraft_tail_number || "",
      paymentMethod: row.payment_method || "",
      notes: row.notes || "",
      lineItems: [lineItem],
    };
  });

  // Group expenses by trip name
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
  for (const [tripName, tripExpenses] of tripMap) {
    const dates = tripExpenses.map((e) => e.date).sort();
    const tailNumbers = [...new Set(tripExpenses.map((e) => e.tailNumber).filter(Boolean))];

    parsedTrips.push({
      tripNumber: tripName,
      name: tripName,
      flightIds: [],
      tailNumber: tailNumbers[0] || "",
      startDate: dates[0] || "",
      endDate: dates[dates.length - 1] || "",
      expenses: tripExpenses,
    });
  }

  if (standAloneExpenses.length > 0) {
    warnings.push(
      `${standAloneExpenses.length} expenses have no trip name and will be imported without a trip association`
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

  // Check which entities already exist
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
    source: "csv_template",
    aircraft: uniqueAircraft,
    trips: parsedTrips,
    uniqueCategories,
    uniqueVendors,
    uniquePaymentMethods,
    totalExpenses: parsedExpenses.length,
    totalLineItems,
    receiptCount: 0,
    warnings,
    errors,
    rawData: rows,
  };
}
