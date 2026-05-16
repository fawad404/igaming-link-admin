import { NextResponse } from "next/server";
import { Session } from "next-auth";

export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user) return false;
  if (session.user.role === "super-admin") return true;
  return (session.user.permissions ?? []).includes(permission);
}

// Returns a 401/403 NextResponse if the check fails, null if allowed.
export function checkPermission(
  session: Session | null,
  permission: string
): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(session, permission)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }
  return null;
}
