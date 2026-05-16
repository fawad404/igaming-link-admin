"use client";

import { useSession } from "next-auth/react";

export function usePermission() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const perms = session?.user?.permissions ?? [];

  function can(permission: string): boolean {
    if (!session?.user) return false;
    if (role === "super-admin") return true;
    return perms.includes(permission);
  }

  function canAny(...permissions: string[]): boolean {
    return permissions.some(can);
  }

  return { can, canAny, role, permissions: perms };
}
