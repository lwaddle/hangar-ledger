import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpense, deleteExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import {
  Table,
  TableBody,
  TableCell,
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

        {expense.expense_line_items && expense.expense_line_items.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Line Items</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Fuel</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expense.expense_line_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.description || ""}</TableCell>
                    <TableCell className="text-right">
                      {item.category === "Fuel" && item.quantity_gallons
                        ? item.quantity_gallons.toFixed(2)
                        : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
