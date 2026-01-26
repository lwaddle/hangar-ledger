import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

const roleConfig: Record<
  UserRole,
  { label: string; className: string; description: string }
> = {
  admin: {
    label: "Admin",
    className: "bg-red-100 text-red-800 border-red-200",
    description: "Full access including user management and deletion",
  },
  operator: {
    label: "Operator",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Can create, edit, and view all data",
  },
  viewer: {
    label: "Viewer",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Read-only access to all data",
  },
};

type UserRoleBadgeProps = {
  role: UserRole;
  showDescription?: boolean;
  size?: "sm" | "md";
};

export function UserRoleBadge({
  role,
  showDescription = false,
  size = "sm",
}: UserRoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <div className={showDescription ? "flex flex-col gap-1" : ""}>
      <span
        className={cn(
          "inline-flex items-center rounded-full border font-medium",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
          config.className
        )}
      >
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500">{config.description}</span>
      )}
    </div>
  );
}

export function getRoleDescription(role: UserRole): string {
  return roleConfig[role].description;
}
