"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { DeleteExpenseButton } from "@/components/delete-expense-button";

interface ExpenseActionsProps {
  expenseId: string;
  vendor: string;
}

export function ExpenseActions({ expenseId, vendor }: ExpenseActionsProps) {
  const { canEdit, canDelete } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href={`/expenses/${expenseId}/edit`}>Edit</Link>
      </Button>
      {canDelete && <DeleteExpenseButton expenseId={expenseId} vendor={vendor} />}
    </div>
  );
}
