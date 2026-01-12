"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ExpenseWithLineItems, ExpenseWithRelations } from "@/lib/actions/expenses";

type Props = {
  expense: ExpenseWithLineItems | ExpenseWithRelations;
  showTrip?: boolean;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function ExpandableExpenseRow({ expense, showTrip = false }: Props) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const isItemized = expense.expense_line_items.length > 1;
  const displayCategory = isItemized ? "Itemized" : expense.category;

  // Sum up all fuel gallons from line items
  const totalFuelGallons = expense.expense_line_items
    .filter((item) => item.category === "Fuel" && item.quantity_gallons)
    .reduce((sum, item) => sum + (item.quantity_gallons || 0), 0);

  const handleRowClick = () => {
    router.push(`/expenses/${expense.id}`);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-gray-50"
        onClick={handleRowClick}
      >
        <TableCell className="w-8 pr-0">
          {isItemized && (
            <button
              type="button"
              className="p-1 hover:bg-gray-100 rounded"
              onClick={handleChevronClick}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse line items" : "Expand line items"}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          )}
        </TableCell>
        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
        <TableCell>
          {expense.vendor}
          {expense.vendors?.deleted_at && (
            <span className="text-gray-400 text-sm ml-1">(deleted)</span>
          )}
        </TableCell>
        <TableCell>{displayCategory}</TableCell>
        {showTrip && (
          <TableCell>
            {"trips" in expense && expense.trips ? (
              expense.trips.name
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </TableCell>
        )}
        <TableCell className="text-right font-mono">
          {totalFuelGallons > 0 ? totalFuelGallons.toFixed(2) : ""}
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(expense.amount)}
        </TableCell>
      </TableRow>

      {isExpanded &&
        expense.expense_line_items.map((item) => (
          <TableRow key={item.id} className="bg-muted/30">
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell className="text-sm">{item.category}</TableCell>
            {showTrip && <TableCell />}
            <TableCell className="text-right font-mono text-sm text-muted-foreground">
              {item.category === "Fuel" && item.quantity_gallons
                ? item.quantity_gallons.toFixed(2)
                : ""}
            </TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground">
              {formatCurrency(item.amount)}
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
