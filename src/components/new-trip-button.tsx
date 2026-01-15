"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";

export function NewTripButton() {
  const { canEdit } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <Button asChild>
      <Link href="/trips/new">New Trip</Link>
    </Button>
  );
}

export function EmptyTripsActions() {
  const { canEdit } = useRole();

  if (!canEdit) {
    return (
      <p className="text-sm text-gray-400">
        Contact an administrator to add trips.
      </p>
    );
  }

  return (
    <Button asChild>
      <Link href="/trips/new">Create your first trip</Link>
    </Button>
  );
}
