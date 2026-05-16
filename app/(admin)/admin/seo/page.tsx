"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Trash2, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, Globe, FileText, Layers, Layout,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/* ────────────────────────────────────────────────────────── types ── */

interface SeoHealth {
  hasTitle: boolean;
  hasMetaDesc: boolean;
  hasCanonical: boolean;
  hasOgTitle: boolean;
  hasOgImage: boolean;
  robots: string;
  sitemapInclude: boolean;
  focusKeywordsCount: number;
}

interface SeoRow {
  entityType: string;
  entityId: string;
  label: string;
  slug: string;
  status: string;
  seo: SeoHealth | null;
}

interface RedirectItem {
  _id: string;
  fromPath: string;
  toPath: string;
  type: 301 | 302;
  isActive: boolean;
  hits: number;
  createdAt: string;
}

/* ────────────────────────────────────────────────── helper components ── */

function HealthDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
  if (warn) return <AlertCircle className="h-4 w-4 text-warning shrink-0" />;
  return <XCircle className="h-4 w-4 text-danger shrink-0" />;
}

function entityIcon(type: string) {
  switch (type) {
    case "Article": return <FileText className="h-3.5 w-3.5" />;
    case "Provider": return <Layers className="h-3.5 w-3.5" />;
    case "License": return <Globe className="h-3.5 w-3.5" />;
    case "Page": return <Layout className="h-3.5 w-3.5" />;
    default: return null;
  }
}

/* ────────────────────────────────────────────────── Overview tab ── */

function OverviewTab() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [filtered, setFiltered] = useState<SeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/seo");
        const data = await res.json();
        setRows(data.rows ?? []);
      } catch {
        toast.error("Failed to load SEO overview");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let result = rows;
    if (search) result = result.filter((r) => r.label.toLowerCase().includes(search.toLowerCase()) || r.slug.includes(search));
    if (typeFilter !== "all") result = result.filter((r) => r.entityType === typeFilter);
    if (healthFilter === "missing") result = result.filter((r) => !r.seo || !r.seo.hasTitle || !r.seo.hasMetaDesc);
    if (healthFilter === "complete") result = result.filter((r) => r.seo?.hasTitle && r.seo?.hasMetaDesc && r.seo?.hasOgImage);
    setFiltered(result);
  }, [rows, search, typeFilter, healthFilter]);

  const score = rows.length
    ? Math.round((rows.filter((r) => r.seo?.hasTitle && r.seo?.hasMetaDesc).length / rows.length) * 100)
    : 0;

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total entities", value: rows.length, color: "text-text-main" },
          { label: "SEO configured", value: rows.filter((r) => r.seo?.hasTitle).length, color: "text-success" },
          { label: "Missing meta", value: rows.filter((r) => !r.seo?.hasMetaDesc).length, color: "text-danger" },
          { label: "Completion", value: `${score}%`, color: score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-danger" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-admin-border bg-admin-card p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 w-56" />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary"
        >
          <option value="all">All types</option>
          <option value="Article">Articles</option>
          <option value="Provider">Providers</option>
          <option value="License">Licenses</option>
          <option value="Page">Pages</option>
        </select>
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary"
        >
          <option value="all">All health</option>
          <option value="missing">Missing fields</option>
          <option value="complete">Complete</option>
        </select>
        <span className="flex items-center text-sm text-text-muted">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-x-auto shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">No results found.</div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Entity</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Title</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Meta Desc</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Canonical</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">OG Title</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">OG Image</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Index</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Sitemap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {filtered.map((row) => (
                <tr key={`${row.entityType}:${row.entityId}`} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">{entityIcon(row.entityType)}</span>
                      <div>
                        <p className="font-medium text-text-main">{row.label}</p>
                        <p className="text-xs text-text-muted">/{row.slug}</p>
                      </div>
                    </div>
                  </td>
                  {row.seo ? (
                    <>
                      <td className="px-4 py-3 text-center"><HealthDot ok={row.seo.hasTitle} /></td>
                      <td className="px-4 py-3 text-center"><HealthDot ok={row.seo.hasMetaDesc} /></td>
                      <td className="px-4 py-3 text-center"><HealthDot ok={row.seo.hasCanonical} warn /></td>
                      <td className="px-4 py-3 text-center"><HealthDot ok={row.seo.hasOgTitle} warn /></td>
                      <td className="px-4 py-3 text-center"><HealthDot ok={row.seo.hasOgImage} warn /></td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={row.seo.robots === "noindex" ? "warning" : "success"}>
                          {row.seo.robots ?? "index"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <HealthDot ok={row.seo.sitemapInclude} warn />
                      </td>
                    </>
                  ) : (
                    <td colSpan={7} className="px-4 py-3 text-center text-xs text-danger">
                      No SEO settings configured
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── Redirects tab ── */

function RedirectsTab() {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<RedirectItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<RedirectItem | null>(null);
  const [formData, setFormData] = useState({ fromPath: "", toPath: "", type: 301 as 301 | 302, isActive: true });
  const [formSaving, setFormSaving] = useState(false);

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/seo/redirects?${params}`);
      const data = await res.json();
      setRedirects(data.redirects ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load redirects");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchRedirects(); }, [fetchRedirects]);

  function openCreate() {
    setEditTarget(null);
    setFormData({ fromPath: "", toPath: "", type: 301, isActive: true });
    setShowForm(true);
  }

  function openEdit(r: RedirectItem) {
    setEditTarget(r);
    setFormData({ fromPath: r.fromPath, toPath: r.toPath, type: r.type, isActive: r.isActive });
    setShowForm(true);
  }

  async function handleFormSave() {
    if (!formData.fromPath || !formData.toPath) {
      toast.error("Both paths are required");
      return;
    }
    setFormSaving(true);
    try {
      const url = editTarget ? `/api/seo/redirects/${editTarget._id}` : "/api/seo/redirects";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }
      toast.success(editTarget ? "Redirect updated" : "Redirect created");
      setShowForm(false);
      fetchRedirects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/seo/redirects/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Redirect deleted");
      setDeleteTarget(null);
      fetchRedirects();
    } catch {
      toast.error("Failed to delete redirect");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search paths…" className="pl-9" />
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Redirect
        </Button>
        <span className="text-sm text-text-muted">{total} redirect{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Inline create/edit form */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-admin-card p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-text-main">{editTarget ? "Edit Redirect" : "New Redirect"}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="From Path *" value={formData.fromPath} onChange={(e) => setFormData((f) => ({ ...f, fromPath: e.target.value }))} placeholder="/old-page" />
            <Input label="To Path *" value={formData.toPath} onChange={(e) => setFormData((f) => ({ ...f, toPath: e.target.value }))} placeholder="/new-page" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Redirect Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((f) => ({ ...f, type: parseInt(e.target.value) as 301 | 302 }))}
                className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary"
              >
                <option value={301}>301 — Permanent</option>
                <option value={302}>302 — Temporary</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-admin-border accent-primary"
              />
              <span className="text-sm text-text-main">Active</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end border-t border-admin-border pt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" disabled={formSaving} onClick={handleFormSave}>
              {formSaving ? "Saving…" : editTarget ? "Save Changes" : "Create Redirect"}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : redirects.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">No redirects configured.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">From → To</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Hits</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {redirects.map((r) => (
                <tr key={r._id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-text-main">{r.fromPath}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
                      <span className="text-primary">{r.toPath}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.type === 301 ? "success" : "warning"}>{r.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{r.hits.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Redirect"
        message={`Delete redirect from "${deleteTarget?.fromPath}" → "${deleteTarget?.toPath}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────── Sitemap tab ── */

function SitemapTab() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/seo");
        const data = await res.json();
        setRows((data.rows ?? []).filter((r: SeoRow) => r.seo?.sitemapInclude !== undefined || r.seo === null));
      } catch {
        toast.error("Failed to load sitemap data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleSitemap(row: SeoRow) {
    const key = `${row.entityType}:${row.entityId}`;
    setSavingId(key);
    try {
      const entityTypeToPath: Record<string, string> = {
        Article: "articles",
        Provider: "providers",
        License: "licenses",
        Page: "pages",
      };
      const path = entityTypeToPath[row.entityType];
      const newVal = !(row.seo?.sitemapInclude ?? true);
      const res = await fetch(`/api/${path}/${row.entityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo: { sitemapInclude: newVal } }),
      });
      if (!res.ok) throw new Error("Update failed");
      setRows((prev) =>
        prev.map((r) =>
          r.entityId === row.entityId && r.entityType === row.entityType
            ? { ...r, seo: r.seo ? { ...r.seo, sitemapInclude: newVal } : { hasTitle: false, hasMetaDesc: false, hasCanonical: false, hasOgTitle: false, hasOgImage: false, robots: "index", sitemapInclude: newVal, focusKeywordsCount: 0 } }
            : r
        )
      );
      toast.success("Sitemap setting updated");
    } catch {
      toast.error("Failed to update sitemap setting");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const included = rows.filter((r) => r.seo?.sitemapInclude !== false);
  const excluded = rows.filter((r) => r.seo?.sitemapInclude === false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-admin-border bg-admin-card p-4 shadow-sm">
          <p className="text-2xl font-bold text-success">{included.length}</p>
          <p className="text-xs text-text-muted mt-0.5">Included in sitemap</p>
        </div>
        <div className="rounded-xl border border-admin-border bg-admin-card p-4 shadow-sm">
          <p className="text-2xl font-bold text-danger">{excluded.length}</p>
          <p className="text-xs text-text-muted mt-0.5">Excluded from sitemap</p>
        </div>
        <div className="rounded-xl border border-admin-border bg-admin-card p-4 shadow-sm">
          <p className="text-2xl font-bold text-text-main">{rows.length}</p>
          <p className="text-xs text-text-muted mt-0.5">Total entities</p>
        </div>
      </div>

      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-admin-bg border-b border-admin-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Entity</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Type</th>
              <th className="px-4 py-3 text-center font-medium text-text-muted">Sitemap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {rows.map((row) => {
              const key = `${row.entityType}:${row.entityId}`;
              const included = row.seo?.sitemapInclude !== false;
              return (
                <tr key={key} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-main">{row.label}</p>
                    <p className="text-xs text-text-muted">/{row.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-text-muted text-xs">
                      {entityIcon(row.entityType)} {row.entityType}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {savingId === key ? (
                      <Spinner />
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSitemap(row)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          included
                            ? "bg-success/10 border-success/30 text-success hover:bg-success/20"
                            : "bg-admin-bg border-admin-border text-text-muted hover:border-primary hover:text-primary"
                        }`}
                      >
                        {included ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {included ? "Included" : "Excluded"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── Main page ── */

const TABS = ["overview", "redirects", "sitemap"] as const;
type Tab = typeof TABS[number];

export default function SeoPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main">SEO Manager</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Monitor SEO health, manage redirects, and control sitemap inclusion.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-admin-bg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-admin-card text-text-main shadow-sm"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "redirects" && <RedirectsTab />}
      {tab === "sitemap" && <SitemapTab />}
    </div>
  );
}
