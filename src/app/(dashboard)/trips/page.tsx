import { getTripsWithTotals } from "@/lib/actions/trips";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { NewTripButton, EmptyTripsActions } from "@/components/new-trip-button";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function TripsPage() {
  const trips = await getTripsWithTotals();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trips</h1>
        <NewTripButton />
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No trips yet</p>
          <EmptyTripsActions />
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <ClickableTableRow key={trip.id} href={`/trips/${trip.id}`}>
                  <TableCell className="font-medium">{trip.name}</TableCell>
                  <TableCell>{trip.aircraft}</TableCell>
                  <TableCell>
                    {new Date(trip.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {trip.end_date
                      ? new Date(trip.end_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {trip.total > 0 ? formatCurrency(trip.total) : "-"}
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
