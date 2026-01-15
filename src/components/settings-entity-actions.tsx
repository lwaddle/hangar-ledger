"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { ToggleActiveButton } from "@/components/toggle-active-button";

interface SettingsEntityActionsProps {
  entityType: "aircraft" | "vendor" | "payment-method" | "expense-category";
  entityId: string;
  editHref: string;
  isActive: boolean;
  deleteButton: React.ReactNode;
}

export function SettingsEntityActions({
  entityType,
  entityId,
  editHref,
  isActive,
  deleteButton,
}: SettingsEntityActionsProps) {
  const { canEdit, canDelete } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <ToggleActiveButton
        entityType={entityType}
        entityId={entityId}
        isActive={isActive}
      />
      <Button variant="outline" asChild>
        <Link href={editHref}>Edit</Link>
      </Button>
      {canDelete && deleteButton}
    </div>
  );
}
