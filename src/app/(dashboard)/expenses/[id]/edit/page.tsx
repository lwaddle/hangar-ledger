import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense } from "@/lib/actions/expenses";
import { getReceiptsByExpense } from "@/lib/actions/receipts";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { getTrips } from "@/lib/actions/trips";
import { getCurrentUserRole } from "@/lib/actions/users";
import { ExpenseForm } from "@/components/expense-form";
import { LockBadge } from "@/components/lock-badge";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const [expense, role] = await Promise.all([
    getExpense(id),
    getCurrentUserRole(),
  ]);

  if (!expense) {
    notFound();
  }

  const isTripLocked = expense.trips?.is_locked ?? false;
  const isEffectivelyLocked = expense.is_locked || isTripLocked;

  // If effectively locked and not admin, show locked message
  if (isEffectivelyLocked && role !== "admin") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold">Edit Expense</h1>
          <LockBadge isTripLocked={isTripLocked && !expense.is_locked} />
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-600 mb-4">
            {isTripLocked && !expense.is_locked
              ? "This expense cannot be edited because its trip is locked. Contact an administrator to unlock the trip."
              : "This expense is locked and cannot be edited. Contact an administrator to unlock it."}
          </p>
          <Button variant="outline" asChild>
            <Link href={`/expenses/${id}`}>Back to Expense</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [vendors, paymentMethods, categories, receipts, trips] = await Promise.all([
    getVendors(),
    getPaymentMethods(),
    getExpenseCategories(),
    getReceiptsByExpense(id),
    getTrips(),
  ]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Edit Expense</h1>
        {isEffectivelyLocked && <LockBadge isTripLocked={isTripLocked && !expense.is_locked} />}
      </div>
      <ExpenseForm
        expense={expense}
        trips={trips}
        vendors={vendors}
        paymentMethods={paymentMethods}
        categories={categories}
        initialReceipts={receipts}
      />
    </div>
  );
}
