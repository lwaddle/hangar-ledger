import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getExpenseCategory,
  getLineItemsByCategory,
  getExpenseCategories,
} from "@/lib/actions/expense-categories";
import { Button } from "@/components/ui/button";
import { DeleteExpenseCategoryButton } from "@/components/delete-expense-category-button";
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

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExpenseCategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const [category, lineItems, allCategories] = await Promise.all([
    getExpenseCategory(id),
    getLineItemsByCategory(id),
    getExpenseCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{category.name}</h1>
            {category.is_system && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Built-in
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {lineItems.length} expense line item
            {lineItems.length !== 1 && "s"}
          </p>
        </div>
        {!category.is_system && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/expense-categories/${category.id}/edit`}>Edit</Link>
            </Button>
            <DeleteExpenseCategoryButton
              categoryId={category.id}
              categoryName={category.name}
              lineItemCount={lineItems.length}
              categories={allCategories}
            />
          </div>
        )}
      </div>

      {category.notes && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{category.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-medium">Expense Line Items</h2>
            {lineItems.length > 0 && (
              <p className="text-sm text-gray-500">
                Total: {formatCurrency(totalAmount)}
              </p>
            )}
          </div>
        </div>

        {lineItems.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No expense line items recorded for this category yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <ClickableTableRow
                  key={item.id}
                  href={`/expenses/${item.expense_id}`}
                >
                  <TableCell>
                    {new Date(item.expenses.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{item.expenses.vendor}</TableCell>
                  <TableCell className="text-gray-500">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
