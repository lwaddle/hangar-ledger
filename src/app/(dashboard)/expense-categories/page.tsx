import { getExpenseCategories } from "@/lib/actions/expense-categories";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { InactiveBadge } from "@/components/inactive-badge";
import {
  NewEntityButton,
  EmptyStateActions,
} from "@/components/settings-entity-buttons";

export default async function ExpenseCategoriesPage() {
  const categories = await getExpenseCategories();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expense Categories</h1>
        <NewEntityButton href="/expense-categories/new" label="New Category" />
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No expense categories yet</p>
          <EmptyStateActions
            href="/expense-categories/new"
            label="Create your first category"
            viewerMessage="Contact an administrator to add expense categories."
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <ClickableTableRow
                  key={category.id}
                  href={`/expense-categories/${category.id}`}
                >
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {category.name}
                      {category.is_system && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Built-in
                        </span>
                      )}
                      {!category.is_active && <InactiveBadge />}
                    </span>
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
