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
  quantity: string;
  quantityUnit: "gallons" | "liters";
  categories: ExpenseCategory[];
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (categoryId: string, categoryName: string) => void;
  onAmountChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityUnitChange: (value: "gallons" | "liters") => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  includeInactiveCategoryId?: string;
};

export function LineItemRow({
  description,
  categoryId,
  amount,
  quantity,
  quantityUnit,
  categories,
  onDescriptionChange,
  onCategoryChange,
  onAmountChange,
  onQuantityChange,
  onQuantityUnitChange,
  onRemove,
  canRemove,
  disabled,
  includeInactiveCategoryId,
}: LineItemRowProps) {
  // Filter to only show active categories, plus the currently selected inactive one if any
  const filteredCategories = categories.filter(
    (c) => c.is_active || c.id === includeInactiveCategoryId
  );

  // Check if current category is a fuel category
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isFuelCategory = selectedCategory?.is_fuel_category ?? false;

  function handleCategoryChange(newCategoryId: string) {
    const category = categories.find((c) => c.id === newCategoryId);
    if (category) {
      onCategoryChange(category.id, category.name);
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

      {isFuelCategory && (
        <div className="grid grid-cols-12 gap-2 items-center pl-4">
          <div className="col-span-5 flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Quantity:</span>
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="0.000"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              disabled={disabled}
              className="text-right font-mono"
            />
          </div>
          <div className="col-span-3">
            <Select
              value={quantityUnit}
              onValueChange={(v) => onQuantityUnitChange(v as "gallons" | "liters")}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gallons">Gallons</SelectItem>
                <SelectItem value="liters">Liters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-4"></div>
        </div>
      )}
    </div>
  );
}
