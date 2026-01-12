"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createExpenseCategoryAndRedirect,
  updateExpenseCategory,
  type ExpenseCategoryFormData,
} from "@/lib/actions/expense-categories";
import type { ExpenseCategory } from "@/types/database";

type Props = {
  category?: ExpenseCategory;
};

export function ExpenseCategoryForm({ category }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlightExpense, setIsFlightExpense] = useState(
    category?.is_flight_expense ?? false
  );
  const [isGeneralExpense, setIsGeneralExpense] = useState(
    category?.is_general_expense ?? false
  );
  const [isFuelCategory, setIsFuelCategory] = useState(
    category?.is_fuel_category ?? false
  );

  const atLeastOneSelected = isFlightExpense || isGeneralExpense;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!atLeastOneSelected) {
      setError("At least one expense type must be selected");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: ExpenseCategoryFormData = {
      name: formData.get("name") as string,
      is_flight_expense: isFlightExpense,
      is_general_expense: isGeneralExpense,
      is_fuel_category: isFuelCategory,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (category) {
        await updateExpenseCategory(category.id, data);
      } else {
        await createExpenseCategoryAndRedirect(data);
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
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          placeholder="e.g., Catering"
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Expense Type *</Label>
        <p className="text-sm text-gray-500">
          Select at least one expense type for this category
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_flight_expense"
              checked={isFlightExpense}
              onCheckedChange={(checked) =>
                setIsFlightExpense(checked === true)
              }
            />
            <Label htmlFor="is_flight_expense" className="font-normal">
              Flight Expense
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_general_expense"
              checked={isGeneralExpense}
              onCheckedChange={(checked) =>
                setIsGeneralExpense(checked === true)
              }
            />
            <Label htmlFor="is_general_expense" className="font-normal">
              General Expense
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="is_fuel_category"
            checked={isFuelCategory}
            onCheckedChange={(checked) => setIsFuelCategory(checked === true)}
          />
          <Label htmlFor="is_fuel_category" className="font-normal">
            Track fuel quantity (gallons/liters)
          </Label>
        </div>
        <p className="text-sm text-gray-500">
          Enable this for fuel purchases to track quantity in addition to cost
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={category?.notes ?? ""}
          placeholder="Optional notes about this category"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !atLeastOneSelected}>
          {loading
            ? "Saving..."
            : category
              ? "Update Category"
              : "Create Category"}
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
