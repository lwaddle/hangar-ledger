"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/lib/actions/users";
import { getRoleDescription } from "@/components/user-role-badge";
import type { UserRole } from "@/types/database";

const roles: { value: UserRole; label: string }[] = [
  { value: "operator", label: "Operator" },
  { value: "viewer", label: "Viewer" },
];

export function InviteUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("operator");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const result = await inviteUser(email, selectedRole);

      if (result.success) {
        setSuccessMessage(
          result.message ||
            "User invited. They will receive an email to set their password."
        );
        // Reset form
        (e.target as HTMLFormElement).reset();
        setSelectedRole("operator");
      } else {
        setError(result.error || "Failed to send invitation");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500">
          An invitation email will be sent to this address
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as UserRole)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                <div className="flex flex-col">
                  <span>{role.label}</span>
                  <span className="text-xs text-gray-500">
                    {getRoleDescription(role.value)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          You can change this later from the user management page
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
          <p className="text-xs text-green-500 mt-2">
            For local development, check Inbucket at{" "}
            <a
              href="http://127.0.0.1:54324"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              http://127.0.0.1:54324
            </a>{" "}
            for the email.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/settings/users")}
          disabled={loading}
        >
          Back to Users
        </Button>
      </div>
    </form>
  );
}
