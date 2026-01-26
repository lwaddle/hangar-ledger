"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockBadge } from "@/components/lock-badge";

type UnlockToEditCardProps = {
  itemType: "trip" | "expense";
  itemId: string;
  backHref: string;
  isTripLocked?: boolean;
  unlockAction: (id: string) => Promise<void>;
};

export function UnlockToEditCard({
  itemType,
  itemId,
  backHref,
  isTripLocked = false,
  unlockAction,
}: UnlockToEditCardProps) {
  const router = useRouter();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlockAction(itemId);
      router.refresh();
    } catch (error) {
      console.error("Failed to unlock:", error);
      setIsUnlocking(false);
    }
  };

  const isLockedViaTrip = itemType === "expense" && isTripLocked;

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <LockBadge isTripLocked={isLockedViaTrip} />
      </div>
      <p className="text-gray-600 mb-4">
        {isLockedViaTrip
          ? "This expense is locked because its trip is locked. Unlock the trip to make changes."
          : `This ${itemType} is locked. Unlock it to make changes.`}
      </p>
      <div className="flex gap-2">
        {!isLockedViaTrip && (
          <Button onClick={handleUnlock} disabled={isUnlocking}>
            <Unlock className="w-4 h-4 mr-2" />
            {isUnlocking ? "Unlocking..." : "Unlock to Edit"}
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={backHref}>
            {isLockedViaTrip ? "Go to Trip" : `Back to ${itemType === "trip" ? "Trip" : "Expense"}`}
          </Link>
        </Button>
      </div>
    </div>
  );
}
