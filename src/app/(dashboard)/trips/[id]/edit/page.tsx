import { notFound } from "next/navigation";
import { getTrip } from "@/lib/actions/trips";
import { getActiveAircraft } from "@/lib/actions/aircraft";
import { TripForm } from "@/components/trip-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: Props) {
  const { id } = await params;
  const [trip, aircraft] = await Promise.all([
    getTrip(id),
    getActiveAircraft(),
  ]);

  if (!trip) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Trip</h1>
      <TripForm trip={trip} aircraft={aircraft} />
    </div>
  );
}
