"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";
import { updateUserRole } from "@/lib/actions/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoleDescription } from "@/components/user-role-badge";

type UserRoleSelectProps = {
  userId: string;
  currentRole: UserRole;
};

const roles: UserRole[] = ["admin", "operator", "viewer"];

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(newRole: UserRole) {
    if (newRole === currentRole) return;

    setIsUpdating(true);
    setError(null);

    try {
      await updateUserRole(userId, newRole);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={currentRole}
        onValueChange={(value) => handleRoleChange(value as UserRole)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              <div className="flex flex-col">
                <span className="capitalize">{role}</span>
                <span className="text-xs text-gray-500">
                  {getRoleDescription(role)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
