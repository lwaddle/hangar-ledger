"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCategory } from "@/types/database";
import { X } from "lucide-react";

type LineItemRowProps = {
  description: string;
  categoryId: string;
  amount: string;
  categories: ExpenseCategory[];
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (categoryId: string, categoryName: string) => void;
  onAmountChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  includeInactiveCategoryId?: string;
};

export function LineItemRow({
  description,
  categoryId,
  amount,
  categories,
  onDescriptionChange,
  onCategoryChange,
  onAmountChange,
  onRemove,
  canRemove,
  disabled,
  includeInactiveCategoryId,
}: LineItemRowProps) {
  // Filter to only show active categories, plus the currently selected inactive one if any
  const filteredCategories = categories.filter(
    (c) => c.is_active || c.id === includeInactiveCategoryId
  );

  function handleCategoryChange(newCategoryId: string) {
    const selectedCategory = categories.find((c) => c.id === newCategoryId);
    if (selectedCategory) {
      onCategoryChange(selectedCategory.id, selectedCategory.name);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-5">
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="col-span-4">
          <Select
            value={categoryId}
            onValueChange={handleCategoryChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.is_active ? cat.name : `${cat.name} (inactive)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            disabled={disabled}
            className="text-right font-mono"
          />
        </div>

        <div className="col-span-1 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove || disabled}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
