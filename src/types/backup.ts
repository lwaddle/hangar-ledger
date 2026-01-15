export interface BackupManifest {
  version: number;
  appVersion: string;
  createdAt: string;
  userId: string;
  counts: {
    aircraft: number;
    vendors: number;
    categories: number;
    paymentMethods: number;
    trips: number;
    expenses: number;
    lineItems: number;
    receipts: number;
  };
}

export interface BackupReceipt {
  id: string;
  filename: string;
  originalFilename: string;
  storagePath: string;
}

export interface BackupExpense {
  id: string;
  tripId: string | null;
  vendorId: string | null;
  paymentMethodId: string | null;
  categoryId: string | null;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  receipts: BackupReceipt[];
}

export interface BackupLineItem {
  id: string;
  expenseId: string;
  categoryId: string | null;
  description: string | null;
  category: string;
  amount: number;
  quantityGallons: number | null;
  sortOrder: number | null;
  createdAt: string;
}

export interface BackupTrip {
  id: string;
  aircraftId: string | null;
  tripNumber: string | null;
  name: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BackupAircraft {
  id: string;
  tailNumber: string;
  name: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BackupVendor {
  id: string;
  name: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BackupCategory {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  isFuelCategory: boolean;
  isDefault: boolean;
  notes: string | null;
  createdAt: string;
}

export const BACKUP_VERSION = 1;

export interface BackupPaymentMethod {
  id: string;
  name: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BackupData {
  aircraft: BackupAircraft[];
  vendors: BackupVendor[];
  categories: BackupCategory[];
  paymentMethods: BackupPaymentMethod[];
  trips: BackupTrip[];
  expenses: BackupExpense[];
  lineItems: BackupLineItem[];
}

export interface RestoreResult {
  success: boolean;
  created: {
    aircraft: number;
    vendors: number;
    categories: number;
    paymentMethods: number;
    trips: number;
    expenses: number;
    lineItems: number;
    receipts: number;
  };
  skipped: {
    aircraft: number;
    vendors: number;
    categories: number;
    paymentMethods: number;
    trips: number;
    expenses: number;
    lineItems: number;
    receipts: number;
  };
  errors: string[];
}
