import { getExpenses } from "@/lib/actions/expenses";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpandableExpenseRow } from "@/components/expandable-expense-row";
import { NewExpenseButton, EmptyExpensesActions } from "@/components/new-expense-button";

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <NewExpenseButton />
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No expenses yet</p>
          <EmptyExpensesActions />
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <ExpandableExpenseRow
                  key={expense.id}
                  expense={expense}
                  showTrip
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
