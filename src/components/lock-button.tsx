"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  async function handleClick() {
    setLoading(true);
    try {
      if (isLocked) {
        await onUnlock();
      } else {
        await onLock();
      }
    } catch (err) {
      console.error(`Failed to ${isLocked ? "unlock" : "lock"} ${entityType}:`, err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {isLocked ? (
        <>
          <Unlock className="w-4 h-4 mr-1" />
          {loading ? "Unlocking..." : "Unlock"}
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 mr-1" />
          {loading ? "Locking..." : "Lock"}
        </>
      )}
    </Button>
  );
}
