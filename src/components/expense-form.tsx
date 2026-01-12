"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createExpense,
  updateExpense,
  type ExpenseFormData,
  type ExpenseWithTrip,
} from "@/lib/actions/expenses";
import { type Vendor, type PaymentMethod, type ExpenseLineItem } from "@/types/database";
import { VendorCombobox } from "@/components/vendor-combobox";
import { PaymentMethodCombobox } from "@/components/payment-method-combobox";
import { LineItemRow } from "@/components/line-item-row";
import { Plus } from "lucide-react";

const LITERS_PER_GALLON = 3.78541;

type LineItemState = {
  id?: string;
  description: string;
  category: string;
  amount: string;
  quantity: string;
  quantityUnit: "gallons" | "liters";
};

type Props = {
  expense?: ExpenseWithTrip;
  tripName?: string;
  vendors: Vendor[];
  paymentMethods: PaymentMethod[];
  defaultTripId?: string;
};

const emptyLineItem = (): LineItemState => ({
  description: "",
  category: "",
  amount: "",
  quantity: "",
  quantityUnit: "gallons",
});

export function ExpenseForm({ expense, tripName, vendors, paymentMethods, defaultTripId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tripId = expense?.trip_id ?? defaultTripId;
  const [vendorId, setVendorId] = useState<string>(expense?.vendor_id ?? "");
  const [vendorName, setVendorName] = useState<string>(expense?.vendor ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState<string>(expense?.payment_method_id ?? "");
  const [paymentMethodName, setPaymentMethodName] = useState<string>(expense?.payment_method ?? "");

  const [lineItems, setLineItems] = useState<LineItemState[]>(() => {
    if (expense?.expense_line_items && expense.expense_line_items.length > 0) {
      return expense.expense_line_items.map((item: ExpenseLineItem) => ({
        id: item.id,
        description: item.description ?? "",
        category: item.category,
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

  const updateLineItemUnit = (index: number, value: "gallons" | "liters") => {
    setLineItems((items) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], quantityUnit: value };
      return newItems;
    });
  };

  const addLineItem = () => {
    setLineItems((items) => [...items, emptyLineItem()]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((items) => items.filter((_, i) => i !== index));
  };

  const isValid = useMemo(() => {
    if (!vendorName) return false;
    if (lineItems.length === 0) return false;
    return lineItems.every((item) => {
      if (!item.category || parseFloat(item.amount) <= 0) return false;
      if (item.category === "Fuel" && (!item.quantity || parseFloat(item.quantity) <= 0)) {
        return false;
      }
      return true;
    });
  }, [vendorName, lineItems]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data: ExpenseFormData = {
      trip_id: tripId || undefined,
      vendor_id: vendorId || undefined,
      payment_method_id: paymentMethodId || undefined,
      date: formData.get("date") as string,
      vendor: vendorName,
      payment_method: paymentMethodName || undefined,
      notes: (formData.get("notes") as string) || undefined,
      line_items: lineItems.map((item, index) => {
        let quantityGallons: number | null = null;
        if (item.category === "Fuel" && item.quantity) {
          const qty = parseFloat(item.quantity);
          if (qty > 0) {
            quantityGallons = item.quantityUnit === "liters" ? qty / LITERS_PER_GALLON : qty;
          }
        }
        return {
          id: item.id,
          description: item.description || null,
          category: item.category,
          amount: parseFloat(item.amount) || 0,
          quantity_gallons: quantityGallons,
          sort_order: index,
        };
      }),
    };

    try {
      if (expense) {
        await updateExpense(expense.id, data);
      } else {
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
              category={item.category}
              amount={item.amount}
              quantity={item.quantity}
              quantityUnit={item.quantityUnit}
              onDescriptionChange={(v) => updateLineItem(index, "description", v)}
              onCategoryChange={(v) => updateLineItem(index, "category", v)}
              onAmountChange={(v) => updateLineItem(index, "amount", v)}
              onQuantityChange={(v) => updateLineItem(index, "quantity", v)}
              onQuantityUnitChange={(v) => updateLineItemUnit(index, v)}
              onRemove={() => removeLineItem(index)}
              canRemove={lineItems.length > 1}
              disabled={loading}
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
    </form>
  );
}
