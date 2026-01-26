import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense, unlockExpense } from "@/lib/actions/expenses";
import { getReceiptsByExpense } from "@/lib/actions/receipts";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { getTrips, unlockTrip } from "@/lib/actions/trips";
import { getCurrentUserRole } from "@/lib/actions/users";
import { ExpenseForm } from "@/components/expense-form";
import { LockBadge } from "@/components/lock-badge";
import { UnlockToEditCard } from "@/components/unlock-to-edit-card";
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
  const isExpenseLocked = expense.is_locked;
  const isLockedOnlyViaTrip = isTripLocked && !isExpenseLocked;
  const isEffectivelyLocked = isExpenseLocked || isTripLocked;

  // If effectively locked, require unlock before editing
  if (isEffectivelyLocked) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold">Edit Expense</h1>
        </div>
        {role === "admin" ? (
          <UnlockToEditCard
            itemType="expense"
            itemId={isLockedOnlyViaTrip ? expense.trip_id! : id}
            backHref={isLockedOnlyViaTrip ? `/trips/${expense.trip_id}` : `/expenses/${id}`}
            isTripLocked={isLockedOnlyViaTrip}
            unlockAction={isLockedOnlyViaTrip ? unlockTrip : unlockExpense}
          />
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <LockBadge isTripLocked={isLockedOnlyViaTrip} className="mb-4" />
            <p className="text-gray-600 mb-4">
              {isLockedOnlyViaTrip
                ? "This expense cannot be edited because its trip is locked. Contact an administrator to unlock the trip."
                : "This expense is locked and cannot be edited. Contact an administrator to unlock it."}
            </p>
            <Button variant="outline" asChild>
              <Link href={`/expenses/${id}`}>Back to Expense</Link>
            </Button>
          </div>
        )}
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
