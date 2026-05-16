"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, KeyRound, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface RoleOption { _id: string; name: string }

interface UserData {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  role?: { _id: string; name: string; permissions: string[] };
}

interface ActivityItem {
  _id: string;
  action: string;
  entityType: string;
  entityTitle?: string;
  createdAt: string;
}

const isNew = (id: string) => id === "new";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const creating = isNew(id);

  const [loading, setLoading] = useState(!creating);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((d) => setRoles(d.roles ?? []));
  }, []);

  useEffect(() => {
    if (creating) return;
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((d: { user: UserData; recentActivity: ActivityItem[] }) => {
        const u = d.user;
        setName(u.name);
        setEmail(u.email);
        setIsActive(u.isActive);
        setRoleId(u.role?._id ?? "");
        setActivity(d.recentActivity ?? []);
      })
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id, creating]);

  async function handleSave() {
    setSaving(true);
    try {
      const url = creating ? "/api/users" : `/api/users/${id}`;
      const method = creating ? "POST" : "PUT";
      const body = creating
        ? { name, email, password, role: roleId, isActive }
        : { name, email, role: roleId, isActive };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      toast.success(creating ? "User created" : "User updated");
      if (creating) router.push("/admin/users");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Password updated");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  }

  const roleOptions = roles.map((r) => ({ value: r._id, label: r.name }));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-main">
            {creating ? "New User" : `Edit: ${name}`}
          </h1>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4 mr-1.5" /> {creating ? "Create User" : "Save Changes"}
        </Button>
      </div>

      {/* User Details Card */}
      <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-text-main uppercase tracking-wide">User Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
          />
        </div>

        {creating && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
          />
        )}

        <Select
          label="Role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          options={[{ value: "", label: "Select a role…" }, ...roleOptions]}
        />

        <div className="flex items-center gap-3">
          <Toggle checked={isActive} onChange={setIsActive} />
          <span className="text-sm text-text-main">Account Active</span>
        </div>
      </div>

      {/* Password Change (edit mode only) */}
      {!creating && (
        <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main uppercase tracking-wide">Change Password</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm((v) => !v)}>
              <KeyRound className="h-4 w-4 mr-1.5" />
              {showPasswordForm ? "Cancel" : "Change Password"}
            </Button>
          </div>
          {showPasswordForm && (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <Button variant="primary" onClick={handlePasswordChange} loading={changingPassword}>
                Update
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity (edit mode only) */}
      {!creating && activity.length > 0 && (
        <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-main uppercase tracking-wide">Recent Activity</h2>
          </div>
          <ul className="space-y-2">
            {activity.map((item) => (
              <li key={item._id} className="flex items-start justify-between gap-4 py-2 border-b border-admin-border last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{item.action}</Badge>
                  <span className="text-sm text-text-main">
                    {item.entityType}
                    {item.entityTitle ? `: ${item.entityTitle}` : ""}
                  </span>
                </div>
                <span className="text-xs text-text-muted shrink-0">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
