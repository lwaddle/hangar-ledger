"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { LockButton } from "@/components/lock-button";
import { lockExpense, unlockExpense } from "@/lib/actions/expenses";

interface ExpenseActionsProps {
  expenseId: string;
  vendor: string;
  isLocked?: boolean;
  isTripLocked?: boolean;
}

export function ExpenseActions({
  expenseId,
  vendor,
  isLocked = false,
  isTripLocked = false,
}: ExpenseActionsProps) {
  const { canEdit, canDelete, isAdmin } = useRole();

  if (!canEdit) {
    return null;
  }

  // Expense is effectively locked if either it or its trip is locked
  const isEffectivelyLocked = isLocked || isTripLocked;
  const canEditThisExpense = isAdmin || !isEffectivelyLocked;

  return (
    <div className="flex gap-2">
      {/* Only show lock button if the expense isn't already locked via trip */}
      {!isTripLocked && (
        <LockButton
          isLocked={isLocked}
          onLock={() => lockExpense(expenseId)}
          onUnlock={() => unlockExpense(expenseId)}
          entityType="expense"
        />
      )}
      {canEditThisExpense && (
        <Button variant="outline" asChild>
          <Link href={`/expenses/${expenseId}/edit`}>Edit</Link>
        </Button>
      )}
      {canDelete && canEditThisExpense && (
        <DeleteExpenseButton expenseId={expenseId} vendor={vendor} />
      )}
    </div>
  );
}
