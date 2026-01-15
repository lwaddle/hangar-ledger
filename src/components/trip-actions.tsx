"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { DeleteTripButton } from "@/components/delete-trip-button";

interface TripActionsProps {
  tripId: string;
  tripName: string;
}

export function TripActions({ tripId, tripName }: TripActionsProps) {
  const { canEdit, canDelete } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href={`/trips/${tripId}/edit`}>Edit</Link>
      </Button>
      {canDelete && <DeleteTripButton tripId={tripId} tripName={tripName} />}
    </div>
  );
}

interface AddExpenseButtonProps {
  tripId: string;
}

export function AddExpenseToTripButton({ tripId }: AddExpenseButtonProps) {
  const { canEdit } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <Button size="sm" asChild>
      <Link href={`/expenses/new?trip_id=${tripId}`}>Add Expense</Link>
    </Button>
  );
}
