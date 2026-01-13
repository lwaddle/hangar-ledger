"use client";

import { useState, useTransition } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { createAircraft } from "@/lib/actions/aircraft";
import type { Aircraft } from "@/types/database";

type Props = {
  aircraft: Aircraft[];
  value: string;
  onValueChange: (aircraftId: string, tailNumber: string) => void;
  disabled?: boolean;
  includeInactiveId?: string;
};

export function AircraftCombobox({
  aircraft,
  value,
  onValueChange,
  disabled,
  includeInactiveId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [localAircraft, setLocalAircraft] = useState<Aircraft[]>(aircraft);

  const options: ComboboxOption[] = localAircraft
    .filter((a) => a.is_active || a.id === includeInactiveId)
    .map((a) => ({
      value: a.id,
      label: a.is_active
        ? a.name
          ? `${a.tail_number} - ${a.name}`
          : a.tail_number
        : a.name
          ? `${a.tail_number} - ${a.name} (inactive)`
          : `${a.tail_number} (inactive)`,
    }));

  function handleValueChange(aircraftId: string) {
    const ac = localAircraft.find((a) => a.id === aircraftId);
    if (ac) {
      onValueChange(ac.id, ac.tail_number);
    }
  }

  function handleCreateNew(tailNumber: string) {
    startTransition(async () => {
      try {
        const newAircraft = await createAircraft({ tail_number: tailNumber });
        setLocalAircraft((prev) =>
          [...prev, newAircraft].sort((a, b) =>
            a.tail_number.localeCompare(b.tail_number)
          )
        );
        onValueChange(newAircraft.id, newAircraft.tail_number);
      } catch (error) {
        console.error("Failed to create aircraft:", error);
      }
    });
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={handleValueChange}
      onCreateNew={handleCreateNew}
      placeholder="Select aircraft..."
      searchPlaceholder="Search aircraft..."
      emptyMessage="No aircraft found."
      createNewLabel="Create aircraft"
      disabled={disabled || isPending}
      className="w-full"
    />
  );
}
