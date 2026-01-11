"use client";

import { useState } from "react";
import { deleteVendor, reassignExpensesAndDeleteVendor } from "@/lib/actions/vendors";
import { Button } from "@/components/ui/button";
import { VendorCombobox } from "@/components/vendor-combobox";
import type { Vendor } from "@/types/database";

type Props = {
  vendorId: string;
  vendorName: string;
  expenseCount: number;
  vendors: Vendor[];
};

export function DeleteVendorButton({ vendorId, vendorName, expenseCount, vendors }: Props) {
  const [confirming, setConfirming] = useState(false);
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
    } catch (err) {
      setLoading(false);
      setConfirming(false);
    }
  }

  async function handleReassignAndDelete() {
    if (!targetVendorId) return;
    setLoading(true);
    try {
      await reassignExpensesAndDeleteVendor(vendorId, targetVendorId);
    } catch (err) {
      setLoading(false);
      setShowReassign(false);
    }
  }

  function handleCancel() {
    setConfirming(false);
    setShowReassign(false);
    setTargetVendorId("");
    setTargetVendorName("");
  }

  // Show reassign UI
  if (showReassign) {
    return (
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
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
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReassignAndDelete}
            disabled={loading || !targetVendorId}
          >
            {loading ? "Reassigning..." : "Reassign & Delete"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Show confirmation UI with options when there are linked expenses
  if (confirming && expenseCount > 0) {
    return (
      <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Warning:</strong> {expenseCount} expense{expenseCount !== 1 && "s"} linked to this vendor.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Anyway"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReassign(true)}
            disabled={loading}
          >
            Reassign Expenses
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Simple confirmation for vendors with no expenses
  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Confirm"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
