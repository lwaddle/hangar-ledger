import { TripForm } from "@/components/trip-form";
import { getActiveAircraft } from "@/lib/actions/aircraft";

export default async function NewTripPage() {
  const aircraft = await getActiveAircraft();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Trip</h1>
      <TripForm aircraft={aircraft} />
    </div>
  );
}
