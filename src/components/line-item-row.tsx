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
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
};

export function LineItemRow({
  description,
  category,
  amount,
  onDescriptionChange,
  onCategoryChange,
  onAmountChange,
  onRemove,
  canRemove,
  disabled,
}: LineItemRowProps) {
  return (
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
  );
}
