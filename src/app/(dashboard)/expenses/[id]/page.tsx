import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense } from "@/lib/actions/expenses";
import { getReceiptsByExpense } from "@/lib/actions/receipts";
import { InactiveBadge } from "@/components/inactive-badge";
import { LockBadge } from "@/components/lock-badge";
import { ReceiptList } from "@/components/receipt-list";
import { ExpenseActions } from "@/components/expense-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExpenseDetailPage({ params }: Props) {
  const { id } = await params;
  const [expense, receipts] = await Promise.all([
    getExpense(id),
    getReceiptsByExpense(id),
  ]);

  if (!expense) {
    notFound();
  }

  const isTripLocked = expense.trips?.is_locked ?? false;
  const isEffectivelyLocked = expense.is_locked || isTripLocked;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{expense.vendor}</h1>
            {expense.vendors && !expense.vendors.is_active && <InactiveBadge />}
            {isEffectivelyLocked && <LockBadge isTripLocked={isTripLocked && !expense.is_locked} />}
          </div>
          <p className="text-gray-500 mt-1">
            {new Date(expense.date).toLocaleDateString()} &middot;{" "}
            {expense.category}
          </p>
          {expense.updated_by_profile && (
            <p className="text-xs text-gray-400 mt-2">
              Last updated by {expense.updated_by_profile.display_name || expense.updated_by_profile.email}
              {" · "}
              {new Date(expense.updated_at).toLocaleDateString()} at{" "}
              {new Date(expense.updated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
        <ExpenseActions
          expenseId={expense.id}
          vendor={expense.vendor}
          isLocked={expense.is_locked}
          isTripLocked={isTripLocked}
          createdBy={expense.created_by}
        />
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(expense.amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trip</p>
            {expense.trips ? (
              <Link
                href={`/trips/${expense.trip_id}`}
                className="text-blue-600 hover:underline"
              >
                {expense.trips.name}
              </Link>
            ) : (
              <p className="text-gray-400">No trip assigned</p>
            )}
          </div>
        </div>

        {expense.location && (
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p>{expense.location}</p>
          </div>
        )}

        {expense.expense_line_items && expense.expense_line_items.length > 0 && (() => {
          const hasFuelItems = expense.expense_line_items.some(
            (item) => item.quantity_gallons != null
          );
          const totalFuel = expense.expense_line_items.reduce(
            (sum, item) => sum + (item.quantity_gallons ?? 0),
            0
          );
          return (
            <div>
              <p className="text-sm text-gray-500 mb-2">Line Items</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    {hasFuelItems && <TableHead className="text-right">Fuel (gal)</TableHead>}
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expense.expense_line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {item.category}
                          {item.expense_categories && !item.expense_categories.is_active && (
                            <InactiveBadge />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{item.description || ""}</TableCell>
                      {hasFuelItems && (
                        <TableCell className="text-right font-mono">
                          {item.quantity_gallons != null
                            ? item.quantity_gallons.toFixed(2)
                            : ""}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium">Total</TableCell>
                    {hasFuelItems && (
                      <TableCell className="text-right font-mono font-medium">
                        {totalFuel.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          );
        })()}

        {expense.payment_methods && (
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="flex items-center gap-2">
              {expense.payment_methods.name}
              {!expense.payment_methods.is_active && <InactiveBadge />}
            </p>
          </div>
        )}

        {expense.notes && (
          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p className="whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500 mb-2">Receipts</p>
          <ReceiptList receipts={receipts} expenseId={expense.id} />
        </div>
      </div>
    </div>
  );
}
