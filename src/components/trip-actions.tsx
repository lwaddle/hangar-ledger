"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { DeleteTripButton } from "@/components/delete-trip-button";
import { LockButton } from "@/components/lock-button";
import { lockTrip, unlockTrip } from "@/lib/actions/trips";

interface TripActionsProps {
  tripId: string;
  tripName: string;
  isLocked?: boolean;
}

export function TripActions({ tripId, tripName, isLocked = false }: TripActionsProps) {
  const { canEdit, canDelete, isAdmin } = useRole();

  if (!canEdit) {
    return null;
  }

  const canEditThisTrip = isAdmin || !isLocked;

  return (
    <div className="flex gap-2">
      <LockButton
        isLocked={isLocked}
        onLock={() => lockTrip(tripId)}
        onUnlock={() => unlockTrip(tripId)}
        entityType="trip"
      />
      {canEditThisTrip && (
        <Button variant="outline" asChild>
          <Link href={`/trips/${tripId}/edit`}>Edit</Link>
        </Button>
      )}
      {canDelete && canEditThisTrip && (
        <DeleteTripButton tripId={tripId} tripName={tripName} />
      )}
    </div>
  );
}

interface AddExpenseButtonProps {
  tripId: string;
  isLocked?: boolean;
}

export function AddExpenseToTripButton({ tripId, isLocked = false }: AddExpenseButtonProps) {
  const { canEdit, isAdmin } = useRole();

  if (!canEdit) {
    return null;
  }

  // Can't add expenses to a locked trip (unless admin)
  if (isLocked && !isAdmin) {
    return null;
  }

  return (
    <Button size="sm" asChild>
      <Link href={`/expenses/new?trip_id=${tripId}`}>Add Expense</Link>
    </Button>
  );
}
