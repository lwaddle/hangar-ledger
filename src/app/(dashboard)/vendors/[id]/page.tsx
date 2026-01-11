import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendor, getExpensesByVendor } from "@/lib/actions/vendors";
import { Button } from "@/components/ui/button";
import { DeleteVendorButton } from "@/components/delete-vendor-button";
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

export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  const [vendor, expenses] = await Promise.all([
    getVendor(id),
    getExpensesByVendor(id),
  ]);

  if (!vendor) {
    notFound();
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{vendor.name}</h1>
          <p className="text-gray-500 mt-1">
            {expenses.length} expense{expenses.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vendors/${vendor.id}/edit`}>Edit</Link>
          </Button>
          <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
        </div>
      </div>

      {vendor.notes && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-medium">Expenses</h2>
            {expenses.length > 0 && (
              <p className="text-sm text-gray-500">
                Total: {formatCurrency(totalExpenses)}
              </p>
            )}
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No expenses recorded for this vendor yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {new Date(expense.date).toLocaleDateString()}
                    </Link>
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
