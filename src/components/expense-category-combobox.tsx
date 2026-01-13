"use client";

import { useState, useTransition } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { createExpenseCategory } from "@/lib/actions/expense-categories";
import type { ExpenseCategory } from "@/types/database";

type Props = {
  categories: ExpenseCategory[];
  value: string;
  onValueChange: (categoryId: string, categoryName: string) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  includeInactiveId?: string;
};

export function ExpenseCategoryCombobox({
  categories,
  value,
  onValueChange,
  disabled,
  allowCreate = false,
  includeInactiveId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] =
    useState<ExpenseCategory[]>(categories);

  const options: ComboboxOption[] = localCategories
    .filter((c) => c.is_active || c.id === includeInactiveId)
    .map((c) => ({
      value: c.id,
      label: c.is_active ? c.name : `${c.name} (inactive)`,
    }));

  function handleValueChange(categoryId: string) {
    const category = localCategories.find((c) => c.id === categoryId);
    if (category) {
      onValueChange(category.id, category.name);
    }
  }

  function handleCreateNew(name: string) {
    if (!allowCreate) return;

    startTransition(async () => {
      try {
        const newCategory = await createExpenseCategory({
          name,
        });
        setLocalCategories((prev) =>
          [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
        );
        onValueChange(newCategory.id, newCategory.name);
      } catch (error) {
        console.error("Failed to create category:", error);
      }
    });
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={handleValueChange}
      onCreateNew={allowCreate ? handleCreateNew : undefined}
      placeholder="Select category..."
      searchPlaceholder="Search categories..."
      emptyMessage="No categories found."
      createNewLabel="Create category"
      disabled={disabled || isPending}
      className="w-full"
    />
  );
}
