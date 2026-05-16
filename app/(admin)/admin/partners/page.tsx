"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, BarChart2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface BannerItem {
  _id: string;
  name: string;
  targetUrl: string;
  position?: string;
  image?: { _id: string; url: string; originalName: string } | null;
  geoTargets: string[];
  isActive: boolean;
  impressions: number;
  clicks: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function PartnersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/partners?${params}`);
      const data = await res.json();
      setBanners(data.banners ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load partner banners");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/partners/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Banner deleted");
      setDeleteTarget(null);
      fetchBanners();
    } catch {
      toast.error("Failed to delete banner");
    } finally {
      setDeleting(false);
    }
  }

  function ctr(impressions: number, clicks: number) {
    if (!impressions) return "—";
    return ((clicks / impressions) * 100).toFixed(1) + "%";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Partners & Banners</h1>
          <p className="text-sm text-text-muted mt-0.5">{total} banner{total !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/admin/partners/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New Banner
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search banners…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : banners.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No banners found.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => router.push("/admin/partners/new")}>
              Add your first banner
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Banner</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Position</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Geo Targets</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">
                  <span className="flex items-center gap-1">
                    <BarChart2 className="h-3.5 w-3.5" /> Stats
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {banners.map((b) => (
                <tr key={b._id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.image?.url ? (
                        <div className="relative h-10 w-20 shrink-0 rounded overflow-hidden border border-admin-border bg-admin-bg">
                          <Image src={b.image.url} alt={b.name} fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 w-20 shrink-0 rounded border border-dashed border-admin-border bg-admin-bg flex items-center justify-center text-text-muted/40 text-xs">
                          No img
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-main">{b.name}</p>
                        <p className="text-xs text-text-muted truncate max-w-[180px]">{b.targetUrl}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default" className="capitalize text-[10px]">
                      {b.position ?? "sidebar"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {b.geoTargets.length > 0 ? (
                      <span className="text-text-muted text-xs">
                        {b.geoTargets.slice(0, 3).join(", ")}
                        {b.geoTargets.length > 3 && ` +${b.geoTargets.length - 3}`}
                      </span>
                    ) : (
                      <Badge variant="default">Global</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={b.isActive ? "success" : "default"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-0.5">
                      <p className="text-text-muted">
                        <span className="font-medium text-text-main">{b.impressions.toLocaleString()}</span> impressions
                      </p>
                      <p className="text-text-muted">
                        <span className="font-medium text-text-main">{b.clicks.toLocaleString()}</span> clicks
                        {" "}·{" "}
                        <span className="text-primary font-medium">{ctr(b.impressions, b.clicks)}</span> CTR
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/partners/${b._id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b)}>
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
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
