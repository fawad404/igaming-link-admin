"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Calendar, MapPin, Globe } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface EventItem {
  _id: string;
  title: string;
  slug: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: { city: string; country: string; venue: string; isOnline: boolean };
  image?: { url: string } | null;
  isFeatured: boolean;
  isTrending: boolean;
  status: string;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "default" | "danger"> = {
  upcoming:  "info" as "default",
  ongoing:   "success",
  past:      "default",
  cancelled: "danger",
};

const TYPE_COLOR: Record<string, string> = {
  conference: "bg-blue-100 text-blue-700",
  exhibition: "bg-purple-100 text-purple-700",
  webinar:    "bg-green-100 text-green-700",
  networking: "bg-amber-100 text-amber-700",
  awards:     "bg-pink-100 text-pink-700",
  other:      "bg-gray-100 text-gray-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Event deleted");
      setDeleteTarget(null);
      fetchEvents();
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  }

  const statusOptions = ["", "upcoming", "ongoing", "past", "cancelled"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Events</h1>
          <p className="text-sm text-text-muted mt-0.5">{total} event{total !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/admin/events/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((s) => (
            <button
              key={s || "all"}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white border-primary"
                  : "bg-admin-bg text-text-muted border-admin-border hover:border-primary hover:text-primary"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No events found.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => router.push("/admin/events/new")}>
              Create your first event
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Event</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Dates</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Location</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {events.map((ev) => (
                <tr key={ev._id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ev.image?.url ? (
                        <div className="relative h-10 w-16 shrink-0 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
                          <Image src={ev.image.url} alt={ev.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-16 shrink-0 rounded-lg border border-dashed border-admin-border bg-admin-bg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-text-muted/40" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-main leading-tight">{ev.title}</p>
                        <div className="flex gap-1 mt-0.5">
                          {ev.isFeatured && <Badge variant="info" className="text-[10px] py-0">Featured</Badge>}
                          {ev.isTrending && <Badge variant="warning" className="text-[10px] py-0">Trending</Badge>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLOR[ev.eventType] ?? TYPE_COLOR.other}`}>
                      {ev.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-text-muted space-y-0.5">
                      <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(ev.startDate)}</p>
                      <p className="text-text-muted/60">→ {formatDate(ev.endDate)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      {ev.location.isOnline ? (
                        <><Globe className="h-3 w-3" /> Online</>
                      ) : (
                        <><MapPin className="h-3 w-3" />{[ev.location.city, ev.location.country].filter(Boolean).join(", ") || "—"}</>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[ev.status] ?? "default"} className="capitalize">
                      {ev.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/events/${ev._id}`}>
                        <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(ev)}>
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
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
