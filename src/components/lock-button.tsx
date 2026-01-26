"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRole } from "@/lib/role-context";

type LockButtonProps = {
  isLocked: boolean;
  onLock: () => Promise<void>;
  onUnlock: () => Promise<void>;
  entityType: "trip" | "expense";
};

export function LockButton({
  isLocked,
  onLock,
  onUnlock,
  entityType,
}: LockButtonProps) {
  const { canEdit, isAdmin } = useRole();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Viewers can't see lock buttons
  if (!canEdit) {
    return null;
  }

  // Operators can lock but can't unlock - show disabled state when locked
  if (isLocked && !isAdmin) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Lock className="w-4 h-4 mr-1" />
        Locked
      </Button>
    );
  }

  async function handleLock() {
    setLoading(true);
    setShowConfirm(false);
    try {
      await onLock();
    } catch (err) {
      console.error(`Failed to lock ${entityType}:`, err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock() {
    setLoading(true);
    try {
      await onUnlock();
    } catch (err) {
      console.error(`Failed to unlock ${entityType}:`, err);
    } finally {
      setLoading(false);
    }
  }

  if (isLocked) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnlock}
        disabled={loading}
      >
        <Unlock className="w-4 h-4 mr-1" />
        {loading ? "Unlocking..." : "Unlock"}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
      >
        <Lock className="w-4 h-4 mr-1" />
        {loading ? "Locking..." : "Lock"}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock this {entityType}?</AlertDialogTitle>
            <AlertDialogDescription>
              Once locked, only an administrator can unlock it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLock}>Lock</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
