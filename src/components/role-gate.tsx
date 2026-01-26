"use client";

import { useRole } from "@/lib/role-context";
import type { UserRole } from "@/types/database";

interface RoleGateProps {
  /** Minimum role required to render children */
  allowedRoles: UserRole[];
  /** Content to render if user has required role */
  children: React.ReactNode;
  /** Optional fallback content for unauthorized users */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on user's role.
 *
 * @example
 * // Only show for admins
 * <RoleGate allowedRoles={["admin"]}>
 *   <DeleteButton />
 * </RoleGate>
 *
 * @example
 * // Show for operators and admins
 * <RoleGate allowedRoles={["operator", "admin"]}>
 *   <EditButton />
 * </RoleGate>
 *
 * @example
 * // Show alternative content for viewers
 * <RoleGate allowedRoles={["operator", "admin"]} fallback={<span>View only</span>}>
 *   <EditForm />
 * </RoleGate>
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { role, isLoading } = useRole();

  // While loading, don't show anything to prevent flicker
  if (isLoading) {
    return null;
  }

  // If no role (not logged in), don't show protected content
  if (!role) {
    return <>{fallback}</>;
  }

  // Check if user's role is in the allowed list
  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Quick helper to check if user can edit (operator or admin)
 */
export function CanEdit({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["operator", "admin"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Quick helper to check if user can delete (admin only)
 */
export function CanDelete({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Quick helper to check if user is admin
 */
export function IsAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}
