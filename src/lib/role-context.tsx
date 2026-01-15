"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

interface RoleContextType {
  role: UserRole | null;
  isLoading: boolean;
  /** Check if user has at least the specified role */
  hasRole: (requiredRole: UserRole) => boolean;
  /** Check if user can edit (operator or admin) */
  canEdit: boolean;
  /** Check if user can delete (admin only) */
  canDelete: boolean;
  /** Check if user is admin */
  isAdmin: boolean;
  /** Refresh the role from the server */
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  isLoading: true,
  hasRole: () => false,
  canEdit: false,
  canDelete: false,
  isAdmin: false,
  refresh: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(profile?.role ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRole();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    if (role === "admin") return true;
    if (requiredRole === "operator" && role === "operator") return true;
    if (requiredRole === "viewer") return true;
    return false;
  };

  const value: RoleContextType = {
    role,
    isLoading,
    hasRole,
    canEdit: role === "admin" || role === "operator",
    canDelete: role === "admin",
    isAdmin: role === "admin",
    refresh: fetchRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
