import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrip } from "@/lib/actions/trips";
import { getActiveAircraft } from "@/lib/actions/aircraft";
import { getCurrentUserRole } from "@/lib/actions/users";
import { TripForm } from "@/components/trip-form";
import { LockBadge } from "@/components/lock-badge";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: Props) {
  const { id } = await params;
  const [trip, aircraft, role] = await Promise.all([
    getTrip(id),
    getActiveAircraft(),
    getCurrentUserRole(),
  ]);

  if (!trip) {
    notFound();
  }

  // If locked and not admin, show locked message
  if (trip.is_locked && role !== "admin") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold">Edit Trip</h1>
          <LockBadge />
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-600 mb-4">
            This trip is locked and cannot be edited. Contact an administrator to unlock it.
          </p>
          <Button variant="outline" asChild>
            <Link href={`/trips/${id}`}>Back to Trip</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Edit Trip</h1>
        {trip.is_locked && <LockBadge />}
      </div>
      <TripForm trip={trip} aircraft={aircraft} />
    </div>
  );
}
