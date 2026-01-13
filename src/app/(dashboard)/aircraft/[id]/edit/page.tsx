import { notFound } from "next/navigation";
import { getAircraftById } from "@/lib/actions/aircraft";
import { AircraftForm } from "@/components/aircraft-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAircraftPage({ params }: Props) {
  const { id } = await params;
  const aircraft = await getAircraftById(id);

  if (!aircraft) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Aircraft</h1>
      <AircraftForm aircraft={aircraft} />
    </div>
  );
}
