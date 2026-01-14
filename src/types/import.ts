// Import/Export types

export type ImportSource = "csv_template" | "airplane_manager";

export type ImportSessionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ImportSession = {
  id: string;
  user_id: string;
  source_type: ImportSource;
  status: ImportSessionStatus;
  original_filename: string | null;
  storage_path: string | null;
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_message: string | null;
  metadata: ImportMetadata | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type ImportLogStatus = "success" | "error" | "skipped";

export type ImportLog = {
  id: string;
  import_session_id: string;
  row_number: number;
  status: ImportLogStatus;
  entity_type: string;
  entity_id: string | null;
  source_data: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
};

// Mapping configuration stored in import session metadata
export type ImportMetadata = {
  categoryMappings: Record<string, EntityMapping>;
  vendorMappings: Record<string, EntityMapping>;
  paymentMethodMappings: Record<string, EntityMapping>;
  aircraftMappings: Record<string, AircraftMapping>;
  parseWarnings: string[];
};

export type MappingAction = "map" | "create" | "skip";

export type EntityMapping = {
  action: MappingAction;
  targetId?: string;
  newName?: string;
  isFuelCategory?: boolean; // Only for categories
};

export type AircraftMapping = {
  action: "map" | "create";
  targetId?: string;
  tailNumber: string;
  name?: string;
};

// Airplane Manager CSV row structure (25 columns)
export type AirplaneManagerRow = {
  ExpenseID: string;
  ExpenseItemID: string;
  DateOccurred: string;
  FlightID: string;
  TripNumber: string;
  TailNumber: string;
  VendorID: string;
  VendorName: string;
  VendorPhone: string;
  VendorEmail: string;
  CategoryID: string;
  Category: string;
  CategoryColor: string;
  Purchaser: string;
  PurchaserID: string;
  PaymentMethod: string;
  FuelProvider: string;
  ICAO: string;
  AirportOrLocation: string;
  Gallons: string;
  Reimbursable: string;
  Amount: string;
  Paid: string;
  Notes: string;
  Created: string;
};

// Hangar Ledger CSV template row structure
export type HangarLedgerTemplateRow = {
  date: string;
  trip_name: string;
  aircraft_tail_number: string;
  vendor_name: string;
  category_name: string;
  amount: string;
  gallons: string;
  payment_method: string;
  notes: string;
};

// Parsed data structures for import preview
export type ParsedLineItem = {
  sourceItemId: string;
  category: string;
  categoryId: string;
  amount: number;
  gallons: number | null;
  description: string;
  icao: string;
};

export type ParsedExpense = {
  sourceExpenseId: string;
  date: string;
  vendorName: string;
  vendorId: string | null;
  tripNumber: string;
  tripFlightId: string;
  tailNumber: string;
  paymentMethod: string;
  notes: string;
  lineItems: ParsedLineItem[];
};

export type ParsedTrip = {
  tripNumber: string;
  name: string;
  flightIds: string[];
  tailNumber: string;
  startDate: string;
  endDate: string;
  expenses: ParsedExpense[];
};

// Preview data shown to user before import
export type ImportPreviewData = {
  source: ImportSource;
  aircraft: { tailNumber: string; exists: boolean }[];
  trips: ParsedTrip[];
  uniqueCategories: { name: string; exists: boolean; isFuel: boolean }[];
  uniqueVendors: { name: string; exists: boolean }[];
  uniquePaymentMethods: { name: string; exists: boolean }[];
  totalExpenses: number;
  totalLineItems: number;
  receiptCount: number;
  warnings: string[];
  errors: string[];
  rawData: AirplaneManagerRow[] | HangarLedgerTemplateRow[];
};

// Validation result
export type ValidationError = {
  row: number;
  field: string;
  value: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
};

// Import progress tracking
export type ImportProgress = {
  stage:
    | "vendors"
    | "categories"
    | "payment_methods"
    | "aircraft"
    | "trips"
    | "expenses"
    | "receipts"
    | "complete";
  current: number;
  total: number;
  currentEntity?: string;
};

// Import result summary
export type ImportResult = {
  success: boolean;
  sessionId: string;
  created: {
    vendors: number;
    categories: number;
    paymentMethods: number;
    aircraft: number;
    trips: number;
    expenses: number;
    lineItems: number;
    receipts: number;
  };
  failed: number;
  skipped: number;
  errors: string[];
};

// Receipt file data for import
export type ReceiptFileData = {
  filename: string;
  data: Uint8Array;
  contentType: string;
};

// Duplicate trip detection
export type DuplicateTrip = {
  importTripName: string;
  existingTripId: string;
  existingTripName: string;
  startDate: string;
};
