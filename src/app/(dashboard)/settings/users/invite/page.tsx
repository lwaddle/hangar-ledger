import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/users";
import { InviteUserForm } from "@/components/invite-user-form";

export default async function InviteUserPage() {
  const currentUser = await getCurrentUser();

  // Only admins can access this page
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/settings");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invite User</h1>
        <p className="text-gray-500 mt-1">
          Send an invitation email to a new user
        </p>
      </div>

      <div className="max-w-md">
        <InviteUserForm />
      </div>
    </div>
  );
}
