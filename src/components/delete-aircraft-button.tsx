"use client";

import { useState } from "react";
import { deleteAircraft, reassignTripsAndDeleteAircraft } from "@/lib/actions/aircraft";
import { Button } from "@/components/ui/button";
import { AircraftCombobox } from "@/components/aircraft-combobox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { Aircraft } from "@/types/database";

type Props = {
  aircraftId: string;
  aircraftTailNumber: string;
  tripCount: number;
  allAircraft: Aircraft[];
};

export function DeleteAircraftButton({ aircraftId, aircraftTailNumber, tripCount, allAircraft }: Props) {
  const [open, setOpen] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetAircraftId, setTargetAircraftId] = useState("");

  // Filter out the current aircraft from reassignment options
  const availableAircraft = allAircraft.filter((a) => a.id !== aircraftId);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteAircraft(aircraftId);
      setOpen(false);
    } catch {
      setLoading(false);
    }
  }

  async function handleReassignAndDelete() {
    if (!targetAircraftId) return;
    setLoading(true);
    try {
      await reassignTripsAndDeleteAircraft(aircraftId, targetAircraftId);
      setOpen(false);
    } catch {
      setLoading(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!loading) {
      setOpen(isOpen);
      if (!isOpen) {
        // Reset state when closing
        setShowReassign(false);
        setTargetAircraftId("");
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {aircraftTailNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            {tripCount > 0 ? (
              <>
                <span className="text-amber-600 font-medium">Warning:</span>{" "}
                {tripCount} trip{tripCount !== 1 && "s"} linked to this aircraft.
                {!showReassign && " Choose how to proceed."}
              </>
            ) : (
              "This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showReassign && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Reassign trips to:</p>
            <AircraftCombobox
              aircraft={availableAircraft}
              value={targetAircraftId}
              onValueChange={(id) => {
                setTargetAircraftId(id);
              }}
              disabled={loading}
            />
          </div>
        )}

        <AlertDialogFooter>
          {showReassign ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowReassign(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReassignAndDelete}
                disabled={loading || !targetAircraftId}
              >
                {loading ? "Reassigning..." : "Reassign & Delete"}
              </Button>
            </>
          ) : tripCount > 0 ? (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => setShowReassign(true)}
                disabled={loading}
              >
                Reassign & Delete
              </Button>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
