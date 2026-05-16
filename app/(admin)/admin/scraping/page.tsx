"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Globe, Plus, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Clock, AlertCircle, ExternalLink, Trash2, Edit2, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapeSourceRecord {
  _id: string;
  name: string;
  url: string;
  crawlSchedule?: string;
  isActive: boolean;
  robotsRespected: boolean;
  lastCrawledAt?: string;
  contentType?: string;
  notes?: string;
  createdAt: string;
}

interface ScrapeJobRecord {
  _id: string;
  source?: { _id: string; name: string; url: string };
  status: "pending" | "running" | "done" | "failed" | "approved" | "rejected";
  extractedContent?: string;
  sourceUrl?: string;
  duplicateCheckResult?: string;
  transformationStatus?: string;
  reviewedBy?: { name: string; email: string };
  createdAt: string;
}

type Tab = "sources" | "queue" | "history";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const JOB_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "info",
  running: "warning",
  done: "default",
  failed: "danger",
  approved: "success",
  rejected: "danger",
};

// ─── Source Form ──────────────────────────────────────────────────────────────

interface SourceFormData {
  name: string;
  url: string;
  crawlSchedule: string;
  isActive: boolean;
  robotsRespected: boolean;
  contentType: string;
  notes: string;
}

const EMPTY_FORM: SourceFormData = {
  name: "",
  url: "",
  crawlSchedule: "",
  isActive: true,
  robotsRespected: true,
  contentType: "",
  notes: "",
};

function SourceFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ScrapeSourceRecord | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SourceFormData>(
    initial
      ? {
          name: initial.name,
          url: initial.url,
          crawlSchedule: initial.crawlSchedule ?? "",
          isActive: initial.isActive,
          robotsRespected: initial.robotsRespected,
          contentType: initial.contentType ?? "",
          notes: initial.notes ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SourceFormData>(key: K, val: SourceFormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) { toast.error("Name and URL are required"); return; }

    setSaving(true);
    try {
      const url = initial ? `/api/scraping/sources/${initial._id}` : "/api/scraping/sources";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          url: form.url.trim(),
          crawlSchedule: form.crawlSchedule.trim() || undefined,
          isActive: form.isActive,
          robotsRespected: form.robotsRespected,
          contentType: form.contentType.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Save failed"); return; }
      toast.success(initial ? "Source updated" : "Source created");
      onSave();
      onClose();
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-admin-card border border-admin-border rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="font-semibold text-text-main">{initial ? "Edit Source" : "Add Source"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Casino News Today"
          />
          <Input
            label="URL"
            value={form.url}
            onChange={e => set("url", e.target.value)}
            placeholder="https://example.com/news"
          />
          <Input
            label="Crawl Schedule (optional)"
            value={form.crawlSchedule}
            onChange={e => set("crawlSchedule", e.target.value)}
            placeholder="e.g. daily, weekly, 0 9 * * *"
          />
          <Input
            label="Content Type (optional)"
            value={form.contentType}
            onChange={e => set("contentType", e.target.value)}
            placeholder="e.g. news, blog, press-release"
          />
          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Any notes about this source…"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-main">Active</span>
            <Toggle checked={form.isActive} onChange={v => set("isActive", v)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-main">Respect robots.txt</span>
            <Toggle checked={form.robotsRespected} onChange={v => set("robotsRespected", v)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Saving…" : initial ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Scrape Job Card ──────────────────────────────────────────────────────────

function ScrapeJobCard({
  job,
  showActions,
  onStatusChange,
}: {
  job: ScrapeJobRecord;
  showActions: boolean;
  onStatusChange: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/scraping/jobs/${job._id}/${action}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Action failed"); return; }
      toast.success(action === "approve" ? "Content approved for AI pipeline" : "Job rejected");
      onStatusChange();
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  return (
    <div className="bg-admin-card border border-admin-border rounded-xl shadow-sm">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-text-main text-sm truncate">
              {job.source?.name ?? "Unknown Source"}
            </p>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 shrink-0" />
              {formatDate(job.createdAt)}
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-0.5 ml-1"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  View URL
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={JOB_STATUS_VARIANT[job.status] ?? "default"}>{job.status}</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-admin-border px-5 py-4 space-y-4">
          {job.duplicateCheckResult && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{job.duplicateCheckResult}</p>
            </div>
          )}

          {job.extractedContent ? (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Extracted Content</p>
              <div className="bg-admin-bg border border-admin-border rounded-lg p-3 text-sm text-text-main max-h-64 overflow-y-auto whitespace-pre-wrap">
                {job.extractedContent}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No extracted content yet.</p>
          )}

          {job.transformationStatus && (
            <p className="text-xs text-text-muted">
              Transformation: <span className="text-text-main font-medium">{job.transformationStatus}</span>
            </p>
          )}

          {showActions && job.status === "done" && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handle("approve")}
                disabled={loading !== null}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                {loading === "approve" ? "Approving…" : "Approve → AI Pipeline"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handle("reject")}
                disabled={loading !== null}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                {loading === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          )}

          {(job.status === "approved" || job.status === "rejected") && job.reviewedBy && (
            <p className="text-xs text-text-muted">
              {job.status === "approved" ? "Approved" : "Rejected"} by {job.reviewedBy.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScrapingPage() {
  const [tab, setTab] = useState<Tab>("sources");

  // Sources state
  const [sources, setSources] = useState<ScrapeSourceRecord[]>([]);
  const [sourcesTotal, setSourcesTotal] = useState(0);
  const [sourcesPage, setSourcesPage] = useState(1);
  const [sourcesTotalPages, setSourcesTotalPages] = useState(1);
  const [sourcesSearch, setSourcesSearch] = useState("");
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSource, setEditingSource] = useState<ScrapeSourceRecord | null>(null);
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);

  // Jobs state
  const [jobs, setJobs] = useState<ScrapeJobRecord[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotalPages, setJobsTotalPages] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchSources = useCallback(async (page = 1, search = "") => {
    setSourcesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search });
      const res = await fetch(`/api/scraping/sources?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSources(data.sources);
      setSourcesTotal(data.total);
      setSourcesTotalPages(data.totalPages);
    } catch { toast.error("Failed to load sources"); }
    finally { setSourcesLoading(false); }
  }, []);

  const fetchJobs = useCallback(async (page = 1, statusFilter = "") => {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", status: statusFilter });
      const res = await fetch(`/api/scraping/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs(data.jobs);
      setJobsTotal(data.total);
      setJobsTotalPages(data.totalPages);
    } catch { toast.error("Failed to load jobs"); }
    finally { setJobsLoading(false); }
  }, []);

  useEffect(() => { fetchSources(sourcesPage, sourcesSearch); }, [fetchSources, sourcesPage, sourcesSearch]);

  useEffect(() => {
    if (tab === "queue") fetchJobs(jobsPage, "done");
    else if (tab === "history") fetchJobs(jobsPage, "");
  }, [fetchJobs, tab, jobsPage]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleCrawl(sourceId: string) {
    setCrawlingId(sourceId);
    try {
      const res = await fetch(`/api/scraping/sources/${sourceId}/crawl`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Crawl failed"); return; }
      toast.success("Crawl job queued");
      fetchSources(sourcesPage, sourcesSearch);
    } catch { toast.error("Network error"); }
    finally { setCrawlingId(null); }
  }

  async function handleDeleteSource(id: string) {
    try {
      const res = await fetch(`/api/scraping/sources/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Delete failed"); return; }
      toast.success("Source deleted");
      fetchSources(sourcesPage, sourcesSearch);
    } catch { toast.error("Network error"); }
    finally { setDeleteSourceId(null); }
  }

  async function toggleSourceActive(source: ScrapeSourceRecord) {
    try {
      const res = await fetch(`/api/scraping/sources/${source._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !source.isActive }),
      });
      if (!res.ok) { toast.error("Update failed"); return; }
      fetchSources(sourcesPage, sourcesSearch);
    } catch { toast.error("Network error"); }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "sources", label: "Sources" },
    { id: "queue", label: "Review Queue" },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg: gap-2  lg:gap-0 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Scraping & Source Manager</h1>
          <p className="text-text-muted text-sm mt-1">Manage content sources, review extracted content, and feed the AI pipeline.</p>
        </div>
        {tab === "sources" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setEditingSource(null); setShowSourceForm(true); }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Source
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-admin-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setJobsPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sources Tab ── */}
      {tab === "sources" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search sources…"
              value={sourcesSearch}
              onChange={e => { setSourcesSearch(e.target.value); setSourcesPage(1); }}
              className="max-w-sm"
            />
            <span className="text-sm text-text-muted">{sourcesTotal} source{sourcesTotal !== 1 ? "s" : ""}</span>
          </div>

          {sourcesLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No sources found. Add your first content source.</p>
            </div>
          ) : (
            <div className="bg-admin-card border border-admin-border rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-admin-bg border-b border-admin-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">Source</th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Schedule</th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Last Crawled</th>
                    <th className="text-center px-4 py-3 text-text-muted font-medium">Active</th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {sources.map(source => (
                    <tr key={source._id} className="hover:bg-admin-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-text-main">{source.name}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-text-muted hover:text-primary flex items-center gap-1 mt-0.5"
                          >
                            {source.url.length > 50 ? source.url.slice(0, 50) + "…" : source.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {source.contentType && (
                            <Badge variant="info" className="mt-1">{source.contentType}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-text-muted">
                        {source.crawlSchedule ?? <span className="text-text-muted/50">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-text-muted text-xs">
                        {source.lastCrawledAt ? formatDate(source.lastCrawledAt) : <span className="text-text-muted/50">Never</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle
                          checked={source.isActive}
                          onChange={() => toggleSourceActive(source)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCrawl(source._id)}
                            disabled={crawlingId === source._id || !source.isActive}
                            title="Trigger manual crawl"
                            className="p-1.5"
                          >
                            <RefreshCw className={`h-4 w-4 ${crawlingId === source._id ? "animate-spin" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingSource(source); setShowSourceForm(true); }}
                            className="p-1.5"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteSourceId(source._id)}
                            className="p-1.5 text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sourcesTotalPages > 1 && (
            <Pagination
              page={sourcesPage}
              totalPages={sourcesTotalPages}
              onPageChange={setSourcesPage}
            />
          )}
        </div>
      )}

      {/* ── Review Queue Tab ── */}
      {tab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Scraped content awaiting human review before entering the AI pipeline.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchJobs(jobsPage, "done")}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : jobs.filter(j => j.status === "done").length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Check className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No content waiting for review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.filter(j => j.status === "done").map(job => (
                <ScrapeJobCard
                  key={job._id}
                  job={job}
                  showActions
                  onStatusChange={() => fetchJobs(jobsPage, "done")}
                />
              ))}
            </div>
          )}

          {jobsTotalPages > 1 && (
            <Pagination
              page={jobsPage}
              totalPages={jobsTotalPages}
              onPageChange={setJobsPage}
            />
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              All scrape jobs — {jobsTotal} total
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchJobs(jobsPage, "")}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No scrape jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <ScrapeJobCard
                  key={job._id}
                  job={job}
                  showActions={false}
                  onStatusChange={() => fetchJobs(jobsPage, "")}
                />
              ))}
            </div>
          )}

          {jobsTotalPages > 1 && (
            <Pagination
              page={jobsPage}
              totalPages={jobsTotalPages}
              onPageChange={setJobsPage}
            />
          )}
        </div>
      )}

      {/* Source Form Modal */}
      {showSourceForm && (
        <SourceFormModal
          initial={editingSource}
          onSave={() => fetchSources(sourcesPage, sourcesSearch)}
          onClose={() => { setShowSourceForm(false); setEditingSource(null); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteSourceId && (
        <ConfirmDialog
          open={!!deleteSourceId}
          title="Delete Source"
          message="Are you sure you want to delete this source? All associated scrape jobs will remain but will no longer reference a source."
          confirmLabel="Delete"
          onConfirm={() => handleDeleteSource(deleteSourceId)}
          onClose={() => setDeleteSourceId(null)}
        />
      )}
    </div>
  );
}
