"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  role?: { _id: string; name: string };
}

const ROLE_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info" | "approved"> = {
  "super-admin": "danger",
  developer: "info",
  editor: "success",
  "seo-manager": "warning",
  reviewer: "approved",
  viewer: "default",
};

export default function UsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deactivateTarget, setDeactivateTarget] = useState<UserItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/users/${deactivateTarget._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to deactivate");
      }
      toast.success("User deactivated");
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to deactivate user");
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Users</h1>
          <p className="text-sm text-text-muted mt-0.5">{total} user{total !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/admin/users/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No users found.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => router.push("/admin/users/new")}>
              Add your first user
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">User</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Role</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Last Login</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-main">{u.name}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role ? (
                      <Badge variant={ROLE_VARIANT[u.role.name] ?? "default"}>
                        {u.role.name}
                      </Badge>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {u.lastLogin ? formatDate(u.lastLogin) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? "success" : "default"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${u._id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.isActive && u._id !== currentUserId && (
                        <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(u)}>
                          <UserX className="h-3.5 w-3.5 text-danger" />
                        </Button>
                      )}
                      {u._id === currentUserId && (
                        <span className="text-xs text-text-muted px-2">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name}"? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
        loading={deactivating}
      />
    </div>
  );
}
