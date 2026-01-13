import Link from "next/link";
import { getAircraft } from "@/lib/actions/aircraft";
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
import { InactiveBadge } from "@/components/inactive-badge";

export default async function AircraftPage() {
  const aircraft = await getAircraft();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aircraft</h1>
        <Button asChild>
          <Link href="/aircraft/new">New Aircraft</Link>
        </Button>
      </div>

      {aircraft.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No aircraft yet</p>
          <Button asChild>
            <Link href="/aircraft/new">Add your first aircraft</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tail Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aircraft.map((ac) => (
                <ClickableTableRow key={ac.id} href={`/aircraft/${ac.id}`}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {ac.tail_number}
                      {!ac.is_active && <InactiveBadge />}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {ac.name || "-"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {ac.notes ? (
                      <span className="line-clamp-1">{ac.notes}</span>
                    ) : (
                      "-"
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
