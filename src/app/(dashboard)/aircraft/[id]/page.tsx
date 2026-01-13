import Link from "next/link";
import { notFound } from "next/navigation";
import { getAircraftById, getTripsByAircraft, getAircraft } from "@/lib/actions/aircraft";
import { Button } from "@/components/ui/button";
import { DeleteAircraftButton } from "@/components/delete-aircraft-button";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { InactiveBadge } from "@/components/inactive-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableTableRow } from "@/components/clickable-table-row";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AircraftDetailPage({ params }: Props) {
  const { id } = await params;
  const [aircraft, trips, allAircraft] = await Promise.all([
    getAircraftById(id),
    getTripsByAircraft(id),
    getAircraft(),
  ]);

  if (!aircraft) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{aircraft.tail_number}</h1>
            {!aircraft.is_active && <InactiveBadge />}
          </div>
          {aircraft.name && (
            <p className="text-gray-500 mt-1">{aircraft.name}</p>
          )}
          <p className="text-gray-500 mt-1">
            {trips.length} trip{trips.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <ToggleActiveButton
            entityType="aircraft"
            entityId={aircraft.id}
            isActive={aircraft.is_active}
          />
          <Button variant="outline" asChild>
            <Link href={`/aircraft/${aircraft.id}/edit`}>Edit</Link>
          </Button>
          <DeleteAircraftButton
            aircraftId={aircraft.id}
            aircraftTailNumber={aircraft.tail_number}
            tripCount={trips.length}
            allAircraft={allAircraft}
          />
        </div>
      </div>

      {aircraft.notes && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{aircraft.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-medium">Trips</h2>
        </div>

        {trips.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No trips recorded for this aircraft yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <ClickableTableRow key={trip.id} href={`/trips/${trip.id}`}>
                  <TableCell className="font-medium">{trip.name}</TableCell>
                  <TableCell>
                    {new Date(trip.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {trip.end_date
                      ? new Date(trip.end_date).toLocaleDateString()
                      : "-"}
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
