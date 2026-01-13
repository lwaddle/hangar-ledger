"use client";

import { useState, useTransition } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { createVendor } from "@/lib/actions/vendors";
import type { Vendor } from "@/types/database";

type Props = {
  vendors: Vendor[];
  value: string;
  onValueChange: (vendorId: string, vendorName: string) => void;
  disabled?: boolean;
  includeInactiveId?: string;
};

export function VendorCombobox({
  vendors,
  value,
  onValueChange,
  disabled,
  includeInactiveId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [localVendors, setLocalVendors] = useState<Vendor[]>(vendors);

  const options: ComboboxOption[] = localVendors
    .filter((v) => v.is_active || v.id === includeInactiveId)
    .map((v) => ({
      value: v.id,
      label: v.is_active ? v.name : `${v.name} (inactive)`,
    }));

  function handleValueChange(vendorId: string) {
    const vendor = localVendors.find((v) => v.id === vendorId);
    if (vendor) {
      onValueChange(vendor.id, vendor.name);
    }
  }

  function handleCreateNew(name: string) {
    startTransition(async () => {
      try {
        const newVendor = await createVendor({ name });
        setLocalVendors((prev) =>
          [...prev, newVendor].sort((a, b) => a.name.localeCompare(b.name))
        );
        onValueChange(newVendor.id, newVendor.name);
      } catch (error) {
        console.error("Failed to create vendor:", error);
      }
    });
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={handleValueChange}
      onCreateNew={handleCreateNew}
      placeholder="Select vendor..."
      searchPlaceholder="Search vendors..."
      emptyMessage="No vendors found."
      createNewLabel="Create vendor"
      disabled={disabled || isPending}
      className="w-full"
    />
  );
}
