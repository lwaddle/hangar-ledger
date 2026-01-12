"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createExpense,
  updateExpense,
  type ExpenseFormData,
  type ExpenseWithTrip,
} from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES, type Vendor, type PaymentMethod } from "@/types/database";
import { VendorCombobox } from "@/components/vendor-combobox";
import { PaymentMethodCombobox } from "@/components/payment-method-combobox";

type Props = {
  expense?: ExpenseWithTrip;
  tripName?: string;
  vendors: Vendor[];
  paymentMethods: PaymentMethod[];
  defaultTripId?: string;
};

export function ExpenseForm({ expense, tripName, vendors, paymentMethods, defaultTripId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tripId = expense?.trip_id ?? defaultTripId;
  const [category, setCategory] = useState<string>(expense?.category ?? "");
  const [vendorId, setVendorId] = useState<string>(expense?.vendor_id ?? "");
  const [vendorName, setVendorName] = useState<string>(expense?.vendor ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState<string>(expense?.payment_method_id ?? "");
  const [paymentMethodName, setPaymentMethodName] = useState<string>(expense?.payment_method ?? "");

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
      amount: parseFloat(formData.get("amount") as string),
      category: category,
      payment_method: paymentMethodName || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (expense) {
        await updateExpense(expense.id, data);
      } else {
        await createExpense(data);
      }
    } catch (err) {
      // Rethrow redirect errors - they're not real errors
      if (err instanceof Error && err.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
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
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={expense?.amount}
            placeholder="0.00"
            required
          />
        </div>
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

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Button type="submit" disabled={loading || !category || !vendorName}>
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
