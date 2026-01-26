"use client";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { Trip } from "@/types/database";

type Props = {
  trips: Trip[];
  value: string;
  onValueChange: (tripId: string, tripName: string) => void;
  disabled?: boolean;
};

export function TripCombobox({
  trips,
  value,
  onValueChange,
  disabled,
}: Props) {
  const options: ComboboxOption[] = [
    { value: "", label: "None" },
    ...trips.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.aircraft})`,
    })),
  ];

  function handleValueChange(tripId: string) {
    if (tripId === "") {
      onValueChange("", "");
    } else {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        onValueChange(trip.id, trip.name);
      }
    }
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={handleValueChange}
      placeholder="Select trip..."
      searchPlaceholder="Search trips..."
      emptyMessage="No trips found."
      disabled={disabled}
      className="w-full"
    />
  );
}
