import { notFound } from "next/navigation";
import { getTrip } from "@/lib/actions/trips";
import { TripForm } from "@/components/trip-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: Props) {
  const { id } = await params;
  const trip = await getTrip(id);

  if (!trip) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Trip</h1>
      <TripForm trip={trip} />
    </div>
  );
}
