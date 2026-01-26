"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserProfile, UserRole } from "@/types/database";

/**
 * Get the current user's profile including their role
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Check if the current user has at least the specified role
 * Role hierarchy: admin > operator > viewer
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const currentRole = await getCurrentUserRole();

  if (!currentRole) return false;

  if (currentRole === "admin") return true;
  if (requiredRole === "operator" && currentRole === "operator") return true;
  if (requiredRole === "viewer") return true;

  return false;
}

/**
 * Get all user profiles (admin only in practice via RLS)
 */
export async function getUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get a specific user profile
 */
export async function getUser(id: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<void> {
  const supabase = await createClient();

  // Verify current user is admin
  const currentRole = await getCurrentUserRole();
  if (currentRole !== "admin") {
    throw new Error("Only admins can change user roles");
  }

  // Prevent demoting the last admin
  if (newRole !== "admin") {
    const { data: admins } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("role", "admin");

    const adminCount = admins?.length ?? 0;
    const isDemotingLastAdmin =
      adminCount === 1 && admins?.some((a) => a.id === userId);

    if (isDemotingLastAdmin) {
      throw new Error("Cannot demote the last admin. Promote another user to admin first.");
    }
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw error;
  revalidatePath("/settings/users");
}

/**
 * Update the current user's display name
 */
export async function updateDisplayName(displayName: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings/users");
  revalidatePath("/settings/profile");
}

/**
 * Invite a new user using the admin API
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
 * For local development: Run 'npx supabase status' to get the key.
 * Check Inbucket at http://127.0.0.1:54324 for the invitation email.
 */
export async function inviteUser(
  email: string,
  role: UserRole = "viewer"
): Promise<{ success: boolean; error?: string; message?: string }> {
  const supabase = await createClient();

  // Verify current user is admin
  const currentRole = await getCurrentUserRole();
  if (currentRole !== "admin") {
    return { success: false, error: "Only admins can invite users" };
  }

  // Check if user already exists in profiles
  const { data: existingUsers } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email);

  if (existingUsers && existingUsers.length > 0) {
    return { success: false, error: "A user with this email already exists" };
  }

  // Get current user for invited_by tracking
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  try {
    // Use admin client to invite user
    const adminClient = createAdminClient();

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          invited_by: currentUser?.id,
          invited_role: role,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000"}/auth/callback`,
      });

    if (inviteError) {
      return {
        success: false,
        error: `Failed to invite user: ${inviteError.message}`,
      };
    }

    if (!inviteData.user) {
      return {
        success: false,
        error: "Failed to create user account",
      };
    }

    // Update the user profile with the specified role and invited_by info
    // The trigger should have created a profile, but we need to update it with the role
    const { error: updateError } = await adminClient
      .from("user_profiles")
      .update({
        role: role,
        invited_by: currentUser?.id,
        invited_at: new Date().toISOString(),
      })
      .eq("id", inviteData.user.id);

    if (updateError) {
      console.error("Failed to update user profile:", updateError);
      // Continue anyway - the user was created
    }

    revalidatePath("/settings/users");
    return {
      success: true,
      message:
        "Invitation sent! The user will receive an email to set their password.",
    };
  } catch (error) {
    // If admin client fails (e.g., missing service role key), provide helpful message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false,
        error:
          "Admin API not configured. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file. Run 'npx supabase status' to get the key.",
      };
    }

    return {
      success: false,
      error: `Failed to invite user: ${errorMessage}`,
    };
  }
}

/**
 * Remove a user (admin only)
 * Note: This doesn't delete their auth account, just removes their profile
 * They would need to be re-invited to regain access
 */
export async function removeUser(userId: string): Promise<void> {
  const supabase = await createClient();

  // Verify current user is admin
  const currentRole = await getCurrentUserRole();
  if (currentRole !== "admin") {
    throw new Error("Only admins can remove users");
  }

  // Get current user to prevent self-deletion
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.id === userId) {
    throw new Error("You cannot remove your own account");
  }

  // Prevent removing the last admin
  const { data: admins } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("role", "admin");

  const targetUser = await getUser(userId);
  if (
    targetUser?.role === "admin" &&
    admins?.length === 1 &&
    admins[0].id === userId
  ) {
    throw new Error("Cannot remove the last admin");
  }

  // Delete the profile (auth user remains but has no access)
  const { error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", userId);

  if (error) throw error;
  revalidatePath("/settings/users");
}

/**
 * Get user profile by ID with email lookup
 * Useful for displaying who made changes
 */
export async function getUserDisplayInfo(
  userId: string
): Promise<{ email: string; display_name: string | null } | null> {
  const user = await getUser(userId);
  if (!user) return null;

  return {
    email: user.email,
    display_name: user.display_name,
  };
}
