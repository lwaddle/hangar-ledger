"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAllData } from "@/lib/actions/data-management";

const CONFIRMATION_PHRASE = "delete all data";

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText.toLowerCase() === CONFIRMATION_PHRASE;

  async function handleDelete() {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAllData();
      if (result.success) {
        setOpen(false);
        router.push("/trips");
        router.refresh();
      } else {
        setError(result.error || "Failed to delete data");
        setIsDeleting(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setIsDeleting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!isDeleting) {
      setOpen(newOpen);
      if (!newOpen) {
        setConfirmText("");
        setError(null);
      }
    }
  }

  return (
    <div className="mt-12 rounded-lg border-2 border-red-300 bg-red-50">
      <div className="border-b border-red-200 bg-red-100 px-6 py-3 rounded-t-md">
        <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-gray-900">Delete all data</h3>
            <p className="text-sm text-gray-600 mt-1">
              Permanently delete all trips, expenses, receipts, vendors, payment
              methods, aircraft, and custom expense categories. This action
              cannot be undone.
            </p>
          </div>
          <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shrink-0">
                Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      This action <strong>cannot be undone</strong>. This will
                      permanently delete:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>All receipts and their files</li>
                      <li>All expenses and line items</li>
                      <li>All trips</li>
                      <li>All vendors</li>
                      <li>All payment methods</li>
                      <li>All aircraft</li>
                      <li>All custom expense categories</li>
                      <li>All import history</li>
                    </ul>
                    <p className="text-sm">
                      System expense categories will be preserved.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type{" "}
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">
                    {CONFIRMATION_PHRASE}
                  </span>{" "}
                  to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRMATION_PHRASE}
                  className="mt-2"
                  disabled={isDeleting}
                  autoComplete="off"
                />
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!isConfirmValid || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete All Data"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
