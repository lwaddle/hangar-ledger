"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleExpenseCategoryActive } from "@/lib/actions/expense-categories";
import { toggleVendorActive } from "@/lib/actions/vendors";
import { togglePaymentMethodActive } from "@/lib/actions/payment-methods";

type EntityType = "expense-category" | "vendor" | "payment-method";

type ToggleActiveButtonProps = {
  entityType: EntityType;
  entityId: string;
  isActive: boolean;
};

export function ToggleActiveButton({
  entityType,
  entityId,
  isActive,
}: ToggleActiveButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      switch (entityType) {
        case "expense-category":
          await toggleExpenseCategoryActive(entityId, !isActive);
          break;
        case "vendor":
          await toggleVendorActive(entityId, !isActive);
          break;
        case "payment-method":
          await togglePaymentMethodActive(entityId, !isActive);
          break;
      }
    } catch (error) {
      console.error("Failed to toggle active status:", error);
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" onClick={handleToggle} disabled={loading}>
      {loading ? "..." : isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
