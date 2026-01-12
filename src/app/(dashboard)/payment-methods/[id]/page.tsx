import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaymentMethod, getExpensesByPaymentMethod, getPaymentMethods } from "@/lib/actions/payment-methods";
import { Button } from "@/components/ui/button";
import { DeletePaymentMethodButton } from "@/components/delete-payment-method-button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpandableExpenseRow } from "@/components/expandable-expense-row";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaymentMethodDetailPage({ params }: Props) {
  const { id } = await params;
  const [paymentMethod, expenses, allPaymentMethods] = await Promise.all([
    getPaymentMethod(id),
    getExpensesByPaymentMethod(id),
    getPaymentMethods(),
  ]);

  if (!paymentMethod) {
    notFound();
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{paymentMethod.name}</h1>
          <p className="text-gray-500 mt-1">
            {expenses.length} expense{expenses.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/payment-methods/${paymentMethod.id}/edit`}>Edit</Link>
          </Button>
          <DeletePaymentMethodButton
            paymentMethodId={paymentMethod.id}
            paymentMethodName={paymentMethod.name}
            expenseCount={expenses.length}
            paymentMethods={allPaymentMethods}
          />
        </div>
      </div>

      {paymentMethod.notes && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{paymentMethod.notes}</p>
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
            No expenses recorded with this payment method yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Fuel</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <ExpandableExpenseRow
                  key={expense.id}
                  expense={expense}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
