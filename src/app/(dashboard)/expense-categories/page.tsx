import Link from "next/link";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
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

function getCategoryType(
  isFlightExpense: boolean,
  isGeneralExpense: boolean
): string {
  if (isFlightExpense && isGeneralExpense) {
    return "General & Flight";
  }
  if (isFlightExpense) {
    return "Flight";
  }
  return "General";
}

export default async function ExpenseCategoriesPage() {
  const categories = await getExpenseCategories();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expense Categories</h1>
        <Button asChild>
          <Link href="/expense-categories/new">New Category</Link>
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No expense categories yet</p>
          <Button asChild>
            <Link href="/expense-categories/new">
              Create your first category
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <ClickableTableRow
                  key={category.id}
                  href={`/expense-categories/${category.id}`}
                >
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-gray-500">
                    {getCategoryType(
                      category.is_flight_expense,
                      category.is_general_expense
                    )}
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
