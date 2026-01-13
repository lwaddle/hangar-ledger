"use client";

import { useState, useTransition } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { createPaymentMethod } from "@/lib/actions/payment-methods";
import type { PaymentMethod } from "@/types/database";

type Props = {
  paymentMethods: PaymentMethod[];
  value: string;
  onValueChange: (paymentMethodId: string, paymentMethodName: string) => void;
  disabled?: boolean;
  includeInactiveId?: string;
};

export function PaymentMethodCombobox({
  paymentMethods,
  value,
  onValueChange,
  disabled,
  includeInactiveId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [localPaymentMethods, setLocalPaymentMethods] = useState<PaymentMethod[]>(paymentMethods);

  const options: ComboboxOption[] = localPaymentMethods
    .filter((pm) => pm.is_active || pm.id === includeInactiveId)
    .map((pm) => ({
      value: pm.id,
      label: pm.is_active ? pm.name : `${pm.name} (inactive)`,
    }));

  function handleValueChange(paymentMethodId: string) {
    const paymentMethod = localPaymentMethods.find((pm) => pm.id === paymentMethodId);
    if (paymentMethod) {
      onValueChange(paymentMethod.id, paymentMethod.name);
    }
  }

  function handleCreateNew(name: string) {
    startTransition(async () => {
      try {
        const newPaymentMethod = await createPaymentMethod({ name });
        setLocalPaymentMethods((prev) =>
          [...prev, newPaymentMethod].sort((a, b) => a.name.localeCompare(b.name))
        );
        onValueChange(newPaymentMethod.id, newPaymentMethod.name);
      } catch (error) {
        console.error("Failed to create payment method:", error);
      }
    });
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={handleValueChange}
      onCreateNew={handleCreateNew}
      placeholder="Select payment method..."
      searchPlaceholder="Search payment methods..."
      emptyMessage="No payment methods found."
      createNewLabel="Create payment method"
      disabled={disabled || isPending}
      className="w-full"
    />
  );
}
