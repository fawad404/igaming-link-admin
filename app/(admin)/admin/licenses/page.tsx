"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LicenseItem {
  _id: string;
  name: string;
  slug: string;
  jurisdiction?: string;
  faqs: { question: string; answer: string }[];
  isActive: boolean;
  createdAt: string;
}

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<LicenseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/licenses?${params}`);
      const data = await res.json();
      setLicenses(data.licenses ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load licenses");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/licenses/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("License deleted");
      setDeleteTarget(null);
      fetchLicenses();
    } catch {
      toast.error("Failed to delete license");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Licenses</h1>
          <p className="text-sm text-text-muted mt-0.5">{total} license{total !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/admin/licenses/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New License
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search licenses…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : licenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No licenses found.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => router.push("/admin/licenses/new")}>
              Add your first license
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Jurisdiction</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">FAQs</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {licenses.map((l) => (
                <tr key={l._id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-main">{l.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{l.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {l.jurisdiction || <span className="text-text-muted/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{l.faqs.length} FAQ{l.faqs.length !== 1 ? "s" : ""}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={l.isActive ? "success" : "default"}>
                      {l.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/licenses/${l._id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(l)}>
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
        title="Delete License"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
