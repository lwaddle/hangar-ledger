import { Lock } from "lucide-react";

type LockBadgeProps = {
  isTripLocked?: boolean;
  className?: string;
};

export function LockBadge({ isTripLocked = false, className = "" }: LockBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ${className}`}
    >
      <Lock className="w-3 h-3" />
      {isTripLocked ? "Trip Locked" : "Locked"}
    </span>
  );
}
