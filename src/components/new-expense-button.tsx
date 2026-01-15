"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";

export function NewExpenseButton() {
  const { canEdit } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <Button asChild>
      <Link href="/expenses/new">New Expense</Link>
    </Button>
  );
}

export function EmptyExpensesActions() {
  const { canEdit } = useRole();

  if (!canEdit) {
    return (
      <p className="text-sm text-gray-400">
        Contact an administrator to add expenses.
      </p>
    );
  }

  return (
    <Button asChild>
      <Link href="/expenses/new">Record your first expense</Link>
    </Button>
  );
}
