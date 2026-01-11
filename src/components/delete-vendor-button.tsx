"use client";

import { useState } from "react";
import { deleteVendor, reassignExpensesAndDeleteVendor } from "@/lib/actions/vendors";
import { Button } from "@/components/ui/button";
import { VendorCombobox } from "@/components/vendor-combobox";
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
import type { Vendor } from "@/types/database";

type Props = {
  vendorId: string;
  vendorName: string;
  expenseCount: number;
  vendors: Vendor[];
};

export function DeleteVendorButton({ vendorId, vendorName, expenseCount, vendors }: Props) {
  const [open, setOpen] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetVendorId, setTargetVendorId] = useState("");
  const [targetVendorName, setTargetVendorName] = useState("");

  // Filter out the current vendor from reassignment options
  const availableVendors = vendors.filter((v) => v.id !== vendorId);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteVendor(vendorId);
      setOpen(false);
    } catch (err) {
      setLoading(false);
    }
  }

  async function handleReassignAndDelete() {
    if (!targetVendorId) return;
    setLoading(true);
    try {
      await reassignExpensesAndDeleteVendor(vendorId, targetVendorId);
      setOpen(false);
    } catch (err) {
      setLoading(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!loading) {
      setOpen(isOpen);
      if (!isOpen) {
        // Reset state when closing
        setShowReassign(false);
        setTargetVendorId("");
        setTargetVendorName("");
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
          <AlertDialogTitle>Delete {vendorName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {expenseCount > 0 ? (
              <>
                <span className="text-amber-600 font-medium">Warning:</span>{" "}
                {expenseCount} expense{expenseCount !== 1 && "s"} linked to this vendor.
                {!showReassign && " Choose how to proceed."}
              </>
            ) : (
              "This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showReassign && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Reassign expenses to:</p>
            <VendorCombobox
              vendors={availableVendors}
              value={targetVendorId}
              vendorName={targetVendorName}
              onValueChange={(id, name) => {
                setTargetVendorId(id);
                setTargetVendorName(name);
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
                disabled={loading || !targetVendorId}
              >
                {loading ? "Reassigning..." : "Reassign & Delete"}
              </Button>
            </>
          ) : expenseCount > 0 ? (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => setShowReassign(true)}
                disabled={loading}
              >
                Reassign Expenses
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Anyway"}
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
