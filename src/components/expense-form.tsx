"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createExpense,
  updateExpenseWithLock,
  forceUpdateExpense,
  type ExpenseFormData,
  type ExpenseWithTrip,
} from "@/lib/actions/expenses";
import {
  type Vendor,
  type PaymentMethod,
  type ExpenseLineItem,
  type ExpenseCategory,
  type Receipt,
  type Expense,
} from "@/types/database";
import type { ConflictData, ConflictResolution } from "@/types/collaboration";
import { VendorCombobox } from "@/components/vendor-combobox";
import { PaymentMethodCombobox } from "@/components/payment-method-combobox";
import { LineItemRow } from "@/components/line-item-row";
import { ReceiptDropzone } from "@/components/receipt-dropzone";
import { ReceiptList } from "@/components/receipt-list";
import { ConflictResolutionDialog } from "@/components/conflict-resolution-dialog";
import { Plus } from "lucide-react";

// Field labels for conflict dialog
const EXPENSE_FIELD_LABELS: Partial<Record<keyof Expense, string>> = {
  vendor: "Vendor",
  date: "Date",
  amount: "Total Amount",
  category: "Primary Category",
  payment_method: "Payment Method",
  notes: "Notes",
};

// Format values for conflict dialog display
function formatExpenseValue(field: keyof Expense, value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (field === "amount" && typeof value === "number") {
    return `$${value.toFixed(2)}`;
  }
  if (field === "date" && typeof value === "string") {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

// Extract base expense data from ExpenseWithTrip
function extractBaseExpense(expense: ExpenseWithTrip): Expense {
  return {
    id: expense.id,
    trip_id: expense.trip_id,
    vendor_id: expense.vendor_id,
    payment_method_id: expense.payment_method_id,
    category_id: expense.category_id,
    date: expense.date,
    vendor: expense.vendor,
    amount: expense.amount,
    category: expense.category,
    payment_method: expense.payment_method,
    notes: expense.notes,
    created_at: expense.created_at,
    updated_at: expense.updated_at,
    deleted_at: expense.deleted_at,
    version: expense.version,
    created_by: expense.created_by,
    updated_by: expense.updated_by,
  };
}

type LineItemState = {
  id?: string;
  description: string;
  category: string;
  categoryId: string;
  amount: string;
  quantity: string;
  quantityUnit: "gallons" | "liters";
};

const LITERS_PER_GALLON = 3.78541;

type Props = {
  expense?: ExpenseWithTrip;
  tripName?: string;
  vendors: Vendor[];
  paymentMethods: PaymentMethod[];
  categories: ExpenseCategory[];
  defaultTripId?: string;
  initialReceipts?: Receipt[];
};

const emptyLineItem = (): LineItemState => ({
  description: "",
  category: "",
  categoryId: "",
  amount: "",
  quantity: "",
  quantityUnit: "gallons",
});

export function ExpenseForm({ expense, tripName, vendors, paymentMethods, categories, defaultTripId, initialReceipts }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tripId = expense?.trip_id ?? defaultTripId;
  const [vendorId, setVendorId] = useState<string>(expense?.vendor_id ?? "");
  const [vendorName, setVendorName] = useState<string>(expense?.vendor ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState<string>(expense?.payment_method_id ?? "");
  const [paymentMethodName, setPaymentMethodName] = useState<string>(expense?.payment_method ?? "");
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts ?? []);

  // Conflict handling state
  const [conflictData, setConflictData] = useState<ConflictData<Expense> | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  // Store the base expense when form loads (for conflict detection)
  const baseExpenseRef = useRef<Expense | null>(expense ? extractBaseExpense(expense) : null);
  // Store the last form data for conflict resolution
  const lastFormDataRef = useRef<ExpenseFormData | null>(null);

  const [lineItems, setLineItems] = useState<LineItemState[]>(() => {
    if (expense?.expense_line_items && expense.expense_line_items.length > 0) {
      return expense.expense_line_items.map((item: ExpenseLineItem) => ({
        id: item.id,
        description: item.description ?? "",
        category: item.category,
        categoryId: item.category_id ?? "",
        amount: item.amount.toString(),
        quantity: item.quantity_gallons?.toString() ?? "",
        quantityUnit: "gallons" as const,
      }));
    }
    return [emptyLineItem()];
  });

  const total = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [lineItems]);

  const updateLineItem = (index: number, field: keyof LineItemState, value: string) => {
    setLineItems((items) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const updateLineItemCategory = (index: number, categoryId: string, categoryName: string) => {
    setLineItems((items) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], categoryId, category: categoryName };
      return newItems;
    });
  };

  const updateLineItemQuantityUnit = (index: number, quantityUnit: "gallons" | "liters") => {
    setLineItems((items) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], quantityUnit };
      return newItems;
    });
  };

  const addLineItem = () => {
    setLineItems((items) => [...items, emptyLineItem()]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((items) => items.filter((_, i) => i !== index));
  };

  const handleReceiptUpload = (receipt: Receipt) => {
    setReceipts((prev) => [...prev, receipt]);
  };

  const handleReceiptDelete = (receiptId: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
  };

  const isValid = useMemo(() => {
    if (!vendorName) return false;
    if (lineItems.length === 0) return false;
    return lineItems.every((item) => {
      if (!item.categoryId || parseFloat(item.amount) <= 0) return false;
      // Require quantity for fuel categories
      const category = categories.find((c) => c.id === item.categoryId);
      if (category?.is_fuel_category && (!item.quantity || parseFloat(item.quantity) <= 0)) {
        return false;
      }
      return true;
    });
  }, [vendorName, lineItems, categories]);

  // Build form data from current state
  function buildFormData(formElement: HTMLFormElement): ExpenseFormData {
    const formData = new FormData(formElement);
    return {
      trip_id: tripId || undefined,
      vendor_id: vendorId || undefined,
      payment_method_id: paymentMethodId || undefined,
      date: formData.get("date") as string,
      vendor: vendorName,
      payment_method: paymentMethodName || undefined,
      notes: (formData.get("notes") as string) || undefined,
      line_items: lineItems.map((item, index) => {
        // Convert quantity to gallons if needed
        const category = categories.find((c) => c.id === item.categoryId);
        let quantity_gallons: number | null = null;
        if (category?.is_fuel_category && item.quantity) {
          const qty = parseFloat(item.quantity);
          if (qty > 0) {
            quantity_gallons = item.quantityUnit === "liters" ? qty / LITERS_PER_GALLON : qty;
          }
        }
        return {
          id: item.id,
          category_id: item.categoryId || null,
          description: item.description || null,
          category: item.category,
          amount: parseFloat(item.amount) || 0,
          quantity_gallons,
          sort_order: index,
        };
      }),
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = buildFormData(e.currentTarget);
    lastFormDataRef.current = data;

    try {
      if (expense && baseExpenseRef.current) {
        // Use optimistic locking for updates
        const result = await updateExpenseWithLock(
          expense.id,
          data,
          expense.version,
          baseExpenseRef.current
        );

        if (!result.success) {
          if (result.error === "version_conflict") {
            // Show conflict dialog
            setConflictData(result.conflict);
            setShowConflictDialog(true);
            setLoading(false);
            return;
          }
          // Handle other errors (they all have message property)
          const errorMessage = "message" in result ? result.message : "Failed to update expense";
          setError(errorMessage);
          setLoading(false);
          return;
        }

        // Success - redirect
        router.push(`/expenses/${expense.id}`);
        router.refresh();
      } else {
        // Creating new expense - no conflict possible
        await createExpense(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  // Handle conflict resolution
  async function handleConflictResolve(
    resolution: ConflictResolution,
    mergedData?: Partial<Expense>
  ) {
    if (!expense || !lastFormDataRef.current) return;

    setIsResolving(true);
    setError(null);

    try {
      if (resolution === "keep_mine") {
        // Force update with user's version
        const result = await forceUpdateExpense(expense.id, lastFormDataRef.current);
        if (!result.success) {
          const errorMessage = "message" in result ? result.message : "Failed to save changes";
          setError(errorMessage);
          setIsResolving(false);
          return;
        }
        router.push(`/expenses/${expense.id}`);
        router.refresh();
      } else if (resolution === "keep_theirs") {
        // Discard local changes - reload page to get server state
        router.refresh();
      } else if (resolution === "merge" && mergedData && conflictData) {
        // Apply merged data - update lastFormDataRef with merged values
        const mergedFormData: ExpenseFormData = {
          ...lastFormDataRef.current,
          vendor: mergedData.vendor ?? lastFormDataRef.current.vendor,
          date: mergedData.date ?? lastFormDataRef.current.date,
          notes: mergedData.notes ?? lastFormDataRef.current.notes,
          payment_method: mergedData.payment_method ?? lastFormDataRef.current.payment_method,
        };

        // Force update with merged data
        const result = await forceUpdateExpense(expense.id, mergedFormData);
        if (!result.success) {
          const errorMessage = "message" in result ? result.message : "Failed to save merged changes";
          setError(errorMessage);
          setIsResolving(false);
          return;
        }
        router.push(`/expenses/${expense.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve conflict");
      setIsResolving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {(tripName || expense?.trips?.name) && (
        <div className="space-y-2">
          <Label>Trip</Label>
          <p className="text-sm py-2">{tripName || expense?.trips?.name}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={expense?.date ?? new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor *</Label>
          <VendorCombobox
            vendors={vendors}
            value={vendorId}
            onValueChange={(id, name) => {
              setVendorId(id);
              setVendorName(name);
            }}
            disabled={loading}
            includeInactiveId={expense?.vendor_id ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Line Items *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground px-1">
          <div className="col-span-5">Description</div>
          <div className="col-span-4">Category</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <LineItemRow
              key={index}
              description={item.description}
              categoryId={item.categoryId}
              amount={item.amount}
              quantity={item.quantity}
              quantityUnit={item.quantityUnit}
              categories={categories}
              onDescriptionChange={(v) => updateLineItem(index, "description", v)}
              onCategoryChange={(id, name) => updateLineItemCategory(index, id, name)}
              onAmountChange={(v) => updateLineItem(index, "amount", v)}
              onQuantityChange={(v) => updateLineItem(index, "quantity", v)}
              onQuantityUnitChange={(v) => updateLineItemQuantityUnit(index, v)}
              onRemove={() => removeLineItem(index)}
              canRemove={lineItems.length > 1}
              disabled={loading}
              includeInactiveCategoryId={item.categoryId || undefined}
            />
          ))}
        </div>

        <div className="grid grid-cols-12 gap-2 pt-2 border-t">
          <div className="col-span-9 text-right font-medium">Total:</div>
          <div className="col-span-2 text-right font-mono font-bold">${total.toFixed(2)}</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Payment Method</Label>
        <PaymentMethodCombobox
          paymentMethods={paymentMethods}
          value={paymentMethodId}
          onValueChange={(id, name) => {
            setPaymentMethodId(id);
            setPaymentMethodName(name);
          }}
          disabled={loading}
          includeInactiveId={expense?.payment_method_id ?? undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={expense?.notes ?? ""}
          placeholder="Optional notes"
          rows={3}
        />
      </div>

      {expense && (
        <div className="space-y-3">
          <Label>Receipts</Label>
          <ReceiptList
            receipts={receipts}
            expenseId={expense.id}
            editable
            onDelete={handleReceiptDelete}
          />
          <ReceiptDropzone
            expenseId={expense.id}
            onUploadComplete={handleReceiptUpload}
            disabled={loading}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !isValid}>
          {loading ? "Saving..." : expense ? "Update Expense" : "Create Expense"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>

      {/* Conflict Resolution Dialog */}
      {conflictData && (
        <ConflictResolutionDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          conflict={conflictData}
          fieldLabels={EXPENSE_FIELD_LABELS}
          formatValue={formatExpenseValue}
          onResolve={handleConflictResolve}
          isResolving={isResolving}
        />
      )}
    </form>
  );
}
