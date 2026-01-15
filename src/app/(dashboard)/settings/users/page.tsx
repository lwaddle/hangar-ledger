import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsers, getCurrentUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleBadge } from "@/components/user-role-badge";
import { UserRoleSelect } from "@/components/user-role-select";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  // Only admins can access this page
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/settings");
  }

  const users = await getUsers();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage user access and permissions
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/users/invite">Invite User</Link>
        </Button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900">Role Permissions</h3>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li>
            <strong>Admin:</strong> Full access including user management and
            data deletion
          </li>
          <li>
            <strong>Operator:</strong> Can create, edit, and view all data
          </li>
          <li>
            <strong>Viewer:</strong> Read-only access to all data
          </li>
        </ul>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.display_name || user.email}
                      </span>
                      {user.display_name && (
                        <span className="text-sm text-gray-500">
                          {user.email}
                        </span>
                      )}
                      {user.id === currentUser.id && (
                        <span className="text-xs text-blue-600">(You)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.id === currentUser.id ? (
                      <UserRoleBadge role={user.role} />
                    ) : (
                      <UserRoleSelect
                        userId={user.id}
                        currentRole={user.role}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.id !== currentUser.id && (
                      <RemoveUserButton
                        userId={user.id}
                        userEmail={user.email}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Client component for remove button with confirmation
import { RemoveUserButton } from "@/components/remove-user-button";
