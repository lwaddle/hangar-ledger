"use client";

import { RoleProvider } from "@/lib/role-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <RoleProvider>{children}</RoleProvider>;
}
