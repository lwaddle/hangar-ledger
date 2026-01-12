import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense, deleteExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { DeleteExpenseButton } from "@/components/delete-expense-button";

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
  const expense = await getExpense(id);

  if (!expense) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{expense.vendor}</h1>
          <p className="text-gray-500 mt-1">
            {new Date(expense.date).toLocaleDateString()} &middot;{" "}
            {expense.category}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/expenses/${expense.id}/edit`}>Edit</Link>
          </Button>
          <DeleteExpenseButton expenseId={expense.id} vendor={expense.vendor} />
        </div>
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

        {expense.payment_methods && (
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p>{expense.payment_methods.name}</p>
          </div>
        )}

        {expense.notes && (
          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p className="whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
