"use client";

import { useState, useEffect } from "react";
import { Shield, ChevronDown, ChevronUp, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

interface PermissionDef {
  group: string;
  key: string;
  label: string;
}

interface RoleItem {
  _id: string;
  name: string;
  permissions: string[];
}

const ALL_PERMISSIONS: PermissionDef[] = [
  // Content
  { group: "Content", key: "articles:read", label: "View Articles" },
  { group: "Content", key: "articles:create", label: "Create Articles" },
  { group: "Content", key: "articles:edit", label: "Edit Articles" },
  { group: "Content", key: "articles:delete", label: "Delete Articles" },
  { group: "Content", key: "articles:publish", label: "Publish Articles" },
  { group: "Content", key: "categories:manage", label: "Manage Categories" },
  { group: "Content", key: "tags:manage", label: "Manage Tags" },
  { group: "Content", key: "authors:manage", label: "Manage Authors" },
  // Media
  { group: "Media", key: "media:read", label: "View Media Library" },
  { group: "Media", key: "media:upload", label: "Upload Media" },
  { group: "Media", key: "media:delete", label: "Delete Media" },
  // Website
  { group: "Website", key: "pages:manage", label: "Manage Pages" },
  { group: "Website", key: "providers:manage", label: "Manage Providers" },
  { group: "Website", key: "licenses:manage", label: "Manage Licenses" },
  { group: "Website", key: "partners:manage", label: "Manage Partners & Banners" },
  // SEO & Automation
  { group: "SEO & Automation", key: "seo:manage", label: "Manage SEO & Redirects" },
  { group: "SEO & Automation", key: "ai:generate", label: "Generate AI Content" },
  { group: "SEO & Automation", key: "ai:approve", label: "Approve / Reject AI Content" },
  { group: "SEO & Automation", key: "scraping:manage", label: "Manage Scraping Sources & Jobs" },
  // System
  { group: "System", key: "users:manage", label: "Manage Users" },
  { group: "System", key: "roles:manage", label: "Manage Roles & Permissions" },
  { group: "System", key: "settings:manage", label: "Manage Settings" },
  { group: "System", key: "logs:read", label: "View Audit Logs" },
];

const GROUPS = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

const ROLE_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info" | "approved"> = {
  "super-admin": "danger",
  developer: "info",
  editor: "success",
  "seo-manager": "warning",
  reviewer: "approved",
  viewer: "default",
};

function RoleCard({ role }: { role: RoleItem }) {
  const [expanded, setExpanded] = useState(false);
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role.permissions));
  const [saving, setSaving] = useState(false);
  const isSuperAdmin = role.name === "super-admin";

  function toggle(key: string) {
    if (isSuperAdmin) return;
    setPermissions((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleGroup(group: string) {
    if (isSuperAdmin) return;
    const groupKeys = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key);
    const allChecked = groupKeys.every((k) => permissions.has(k));
    setPermissions((prev) => {
      const next = new Set(prev);
      groupKeys.forEach((k) => (allChecked ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${role._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: [...permissions] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success(`Permissions for "${role.name}" saved`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  const totalGranted = isSuperAdmin ? ALL_PERMISSIONS.length : permissions.size;

  return (
    <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm overflow-hidden">
      {/* Role Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-admin-bg/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-main">{role.name}</span>
              <Badge variant={ROLE_VARIANT[role.name] ?? "default"}>{role.name}</Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isSuperAdmin ? "Full access — all permissions granted" : `${totalGranted} of ${ALL_PERMISSIONS.length} permissions granted`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isSuperAdmin && expanded && (
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </div>

      {/* Permissions Checklist */}
      {expanded && (
        <div className="border-t border-admin-border px-5 py-4 space-y-6">
          {isSuperAdmin ? (
            <p className="text-sm text-text-muted italic">
              Super Admin has unrestricted access to all modules. Permissions cannot be modified.
            </p>
          ) : (
            GROUPS.map((group) => {
              const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
              const allChecked = groupPerms.every((p) => permissions.has(p.key));
              const someChecked = groupPerms.some((p) => permissions.has(p.key));

              return (
                <div key={group}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id={`group-${group}`}
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                      onChange={() => toggleGroup(group)}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <label
                      htmlFor={`group-${group}`}
                      className="text-xs font-semibold text-text-muted uppercase tracking-wide cursor-pointer"
                    >
                      {group}
                    </label>
                  </div>

                  {/* Permission Items */}
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    {groupPerms.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.has(perm.key)}
                          onChange={() => toggle(perm.key)}
                          className="h-4 w-4 accent-primary cursor-pointer"
                        />
                        <span className="text-sm text-text-main group-hover:text-primary transition-colors">
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const DEFAULT_ROLES: { name: string; permissions: string[] }[] = [
  {
    name: "super-admin",
    permissions: [], // super-admin has implicit full access
  },
  {
    name: "developer",
    permissions: [
      "articles:read", "articles:create", "articles:edit", "articles:delete", "articles:publish",
      "categories:manage", "tags:manage", "authors:manage",
      "media:read", "media:upload", "media:delete",
      "pages:manage", "providers:manage", "licenses:manage", "partners:manage",
      "seo:manage", "ai:generate", "ai:approve", "scraping:manage",
      "settings:manage", "logs:read",
    ],
  },
  {
    name: "editor",
    permissions: [
      "articles:read", "articles:create", "articles:edit", "articles:delete",
      "categories:manage", "tags:manage", "authors:manage",
      "media:read", "media:upload",
      "pages:manage", "providers:manage", "licenses:manage",
      "ai:generate", "ai:approve",
      "logs:read",
    ],
  },
  {
    name: "seo-manager",
    permissions: [
      "articles:read", "articles:edit",
      "media:read",
      "seo:manage",
      "ai:generate",
      "logs:read",
    ],
  },
  {
    name: "reviewer",
    permissions: [
      "articles:read",
      "media:read",
      "ai:approve",
      "logs:read",
    ],
  },
  {
    name: "viewer",
    permissions: [
      "articles:read",
      "media:read",
      "logs:read",
    ],
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadRoles = () => {
    setLoading(true);
    fetch("/api/roles")
      .then((r) => r.json())
      .then((d) => setRoles(d.roles ?? []))
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const existingNames = new Set(roles.map((r) => r.name));
  const missingRoles = DEFAULT_ROLES.filter((r) => !existingNames.has(r.name));

  async function handleSeedRoles() {
    setSeeding(true);
    let created = 0;
    let failed = 0;
    for (const role of missingRoles) {
      try {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(role),
        });
        if (res.ok) {
          created++;
        } else {
          const data = await res.json();
          if (data.error !== "Role already exists") failed++;
        }
      } catch {
        failed++;
      }
    }
    setSeeding(false);
    if (created > 0) toast.success(`${created} role${created !== 1 ? "s" : ""} created successfully`);
    if (failed > 0) toast.error(`${failed} role${failed !== 1 ? "s" : ""} failed to create`);
    loadRoles();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Roles & Permissions</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Configure what each role can access. Click a role to expand and edit its permissions.
          </p>
        </div>
        {missingRoles.length > 0 && (
          <button
            onClick={handleSeedRoles}
            disabled={seeding}
            className="shrink-0 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Shield className="h-4 w-4" />
            {seeding ? "Creating…" : `Initialize ${missingRoles.length} Missing Role${missingRoles.length !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Missing roles notice */}
      {missingRoles.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-5 py-4">
          <p className="text-sm font-semibold text-warning mb-1">
            {missingRoles.length} default role{missingRoles.length !== 1 ? "s" : ""} not yet created
          </p>
          <p className="text-xs text-text-muted mb-3">
            The following roles exist in the system definition but have not been added to the database yet.
            Users cannot be assigned these roles until they are created.
          </p>
          <div className="flex flex-wrap gap-2">
            {missingRoles.map((r) => (
              <span
                key={r.name}
                className="rounded-full border border-warning/30 bg-warning/10 px-3 py-0.5 text-xs font-medium text-warning"
              >
                {r.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Role Cards */}
      {roles.length === 0 ? (
        <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm py-16 text-center">
          <Shield className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm mb-4">No roles in the database yet.</p>
          <button
            onClick={handleSeedRoles}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Shield className="h-4 w-4" />
            {seeding ? "Creating…" : "Initialize All Default Roles"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <RoleCard key={role._id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
