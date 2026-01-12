import Link from "next/link";
import { getExpenses } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableTableRow } from "@/components/clickable-table-row";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button asChild>
          <Link href="/expenses/new">New Expense</Link>
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No expenses yet</p>
          <Button asChild>
            <Link href="/expenses/new">Record your first expense</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead className="text-right">Fuel</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <ClickableTableRow key={expense.id} href={`/expenses/${expense.id}`}>
                  <TableCell>
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.vendor}
                    {expense.vendors?.deleted_at && (
                      <span className="text-gray-400 text-sm ml-1">(deleted)</span>
                    )}
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>
                    {expense.trips ? (
                      expense.trips.name
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(() => {
                      const totalGallons = expense.expense_line_items
                        .filter((item) => item.category === "Fuel" && item.quantity_gallons)
                        .reduce((sum, item) => sum + (item.quantity_gallons || 0), 0);
                      return totalGallons > 0 ? totalGallons.toFixed(2) : "";
                    })()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
