"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { ClipboardList, ChevronDown, ChevronRight, User } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";

interface UserRef {
  _id: string;
  name: string;
  email: string;
}

interface LogEntry {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityTitle?: string;
  performedBy?: UserRef;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "published", label: "Published" },
  { value: "approved", label: "Approved" },
  { value: "generated", label: "Generated" },
  { value: "deployed", label: "Deployed" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "Article", label: "Article" },
  { value: "Provider", label: "Provider" },
  { value: "License", label: "License" },
  { value: "Page", label: "Page" },
  { value: "Partner", label: "Partner" },
  { value: "User", label: "User" },
  { value: "Role", label: "Role" },
  { value: "MediaAsset", label: "Media" },
  { value: "AIJob", label: "AI Job" },
  { value: "ScrapeJob", label: "Scrape Job" },
  { value: "Setting", label: "Setting" },
];

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  updated: "bg-amber-100 text-amber-800",
  deleted: "bg-red-100 text-red-800",
  published: "bg-green-100 text-green-800",
  approved: "bg-purple-100 text-purple-800",
  generated: "bg-indigo-100 text-indigo-800",
  deployed: "bg-teal-100 text-teal-800",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (filterAction) params.set("action", filterAction);
      if (filterEntity) params.set("entityType", filterEntity);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      const res = await fetch(`/api/logs?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterEntity, filterDateFrom, filterDateTo]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  const handlePage = (p: number) => {
    setPage(p);
    load(p);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-text-main">Audit Logs</h1>
          <p className="text-sm text-text-muted">
            {total > 0 ? `${total} total events` : "Non-editable record of all admin actions"}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-admin-card border border-admin-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="w-44">
          <Select
            label="Action"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            options={ACTION_OPTIONS}
          />
        </div>
        <div className="w-44">
          <Select
            label="Entity Type"
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            options={ENTITY_OPTIONS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">From</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => {
              const val = e.target.value;
              setFilterDateFrom(val);
              if (filterDateTo && val > filterDateTo) setFilterDateTo("");
            }}
            className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-main mb-1">To</label>
          <input
            type="date"
            value={filterDateTo}
            min={filterDateFrom || undefined}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        {(filterAction || filterEntity || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => {
              setFilterAction("");
              setFilterEntity("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
            className="text-sm text-text-muted hover:text-danger transition-colors self-end mb-0.5"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-admin-card border border-admin-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-muted">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No log entries found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-admin-bg border-b border-admin-border">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left font-semibold text-text-main">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-text-main">User</th>
                <th className="px-4 py-3 text-left font-semibold text-text-main">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-text-main">Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-text-main">Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const hasDetails =
                  log.metadata || log.ipAddress || log.userAgent;

                return (
                  <>
                    <tr
                      key={log._id}
                      onClick={() => hasDetails && toggleExpand(log._id)}
                      className={`transition-colors ${hasDetails ? "cursor-pointer hover:bg-admin-bg" : ""}`}
                    >
                      <td className="px-4 py-3 text-text-muted">
                        {hasDetails ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {log.performedBy ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-text-main leading-tight">
                                {log.performedBy.name}
                              </p>
                              <p className="text-xs text-text-muted">{log.performedBy.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-muted">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{log.entityType}</td>
                      <td className="px-4 py-3 text-text-main max-w-xs truncate">
                        {log.entityTitle ?? (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${log._id}-detail`} className="bg-admin-bg">
                        <td />
                        <td colSpan={5} className="px-4 py-4">
                          <div className="space-y-3">
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                                  Metadata
                                </p>
                                <pre className="text-xs bg-admin-card border border-admin-border rounded-lg p-3 overflow-x-auto text-text-main font-mono leading-relaxed">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
                              {log.entityId && (
                                <span>
                                  <span className="font-medium text-text-main">Entity ID:</span>{" "}
                                  {log.entityId}
                                </span>
                              )}
                              {log.ipAddress && (
                                <span>
                                  <span className="font-medium text-text-main">IP:</span>{" "}
                                  {log.ipAddress}
                                </span>
                              )}
                              {log.userAgent && (
                                <span className="max-w-lg truncate">
                                  <span className="font-medium text-text-main">User Agent:</span>{" "}
                                  {log.userAgent}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
      </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePage} />
      )}
    </div>
  );
}
