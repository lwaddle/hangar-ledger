import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrip } from "@/lib/actions/trips";
import { getExpensesByTrip } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { DeleteTripButton } from "@/components/delete-trip-button";
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

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const [trip, expenses] = await Promise.all([
    getTrip(id),
    getExpensesByTrip(id),
  ]);

  if (!trip) {
    notFound();
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{trip.name}</h1>
          <p className="text-gray-500 mt-1">
            {trip.aircraft} &bull;{" "}
            {new Date(trip.start_date).toLocaleDateString()}
            {trip.end_date &&
              ` - ${new Date(trip.end_date).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/trips/${trip.id}/edit`}>Edit</Link>
          </Button>
          <DeleteTripButton tripId={trip.id} tripName={trip.name} />
        </div>
      </div>

      {trip.notes && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{trip.notes}</p>
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
          <Button size="sm" asChild>
            <Link href={`/expenses/new?trip_id=${trip.id}`}>Add Expense</Link>
          </Button>
        </div>

        {expenses.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No expenses recorded for this trip yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
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
