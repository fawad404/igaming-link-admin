"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface PageItem {
  _id: string;
  title: string;
  slug: string;
  sections: { type: string }[];
  isVisible: boolean;
  updatedAt: string;
}

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PageItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/pages?${params}`);
      const data = await res.json();
      setPages(data.pages ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pages/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Page deleted");
      setDeleteTarget(null);
      fetchPages();
    } catch {
      toast.error("Failed to delete page");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleVisibility(p: PageItem) {
    setTogglingId(p._id);
    try {
      const res = await fetch(`/api/pages/${p._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !p.isVisible }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Page ${!p.isVisible ? "shown" : "hidden"}`);
      setPages((prev) =>
        prev.map((item) => (item._id === p._id ? { ...item, isVisible: !item.isVisible } : item))
      );
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Pages</h1>
          <p className="text-sm text-text-muted mt-0.5">{total} page{total !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/admin/pages/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New Page
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search pages…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : pages.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No pages found.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => router.push("/admin/pages/new")}>
              Create your first page
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Sections</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Visibility</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Last Updated</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {pages.map((p) => (
                <tr key={p._id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-main">{p.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {p.sections.length > 0 ? (
                      <Badge variant="default">
                        {p.sections.length} section{p.sections.length !== 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <span className="text-text-muted/50 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(p)}
                      disabled={togglingId === p._id}
                      className="flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                      title={p.isVisible ? "Click to hide" : "Click to show"}
                    >
                      {togglingId === p._id ? (
                        <Spinner />
                      ) : p.isVisible ? (
                        <>
                          <Eye className="h-4 w-4 text-success" />
                          <Badge variant="success">Visible</Badge>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-text-muted" />
                          <Badge variant="default">Hidden</Badge>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/pages/${p._id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}>
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

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
