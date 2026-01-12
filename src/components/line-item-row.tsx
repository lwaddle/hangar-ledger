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
import { EXPENSE_CATEGORIES } from "@/types/database";
import { X } from "lucide-react";

type LineItemRowProps = {
  description: string;
  category: string;
  amount: string;
  quantity: string;
  quantityUnit: "gallons" | "liters";
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityUnitChange: (value: "gallons" | "liters") => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
};

export function LineItemRow({
  description,
  category,
  amount,
  quantity,
  quantityUnit,
  onDescriptionChange,
  onCategoryChange,
  onAmountChange,
  onQuantityChange,
  onQuantityUnitChange,
  onRemove,
  canRemove,
  disabled,
}: LineItemRowProps) {
  const isFuel = category === "Fuel";

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
          <Select value={category} onValueChange={onCategoryChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
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

      {isFuel && (
        <div className="grid grid-cols-12 gap-2 items-start pl-4">
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
