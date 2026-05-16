"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Cpu, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface AIJobRecord {
  _id: string;
  type: string;
  status: string;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  aiModel?: string;
  tokensUsed?: number;
  error?: string;
  requestedBy?: { name: string; email: string };
  approvedBy?: { name: string; email: string };
  createdAt: string;
  completedAt?: string;
}

interface Props {
  job: AIJobRecord;
  onStatusChange: () => void;
}

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  queued: "info",
  running: "warning",
  done: "default",
  failed: "danger",
  approved: "success",
  rejected: "danger",
};

const TYPE_LABELS: Record<string, string> = {
  draft: "Article Draft",
  rewrite: "Rewrite",
  seo: "SEO Metadata",
  faq: "FAQ List",
  summary: "Summary",
};

export function AiApprovalCard({ job, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      const res = await fetch(`/api/ai/jobs/${job._id}/approve`, { method: "PUT" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Job approved");
      onStatusChange();
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  async function handleReject() {
    setLoading("reject");
    try {
      const res = await fetch(`/api/ai/jobs/${job._id}/reject`, { method: "PUT" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Job rejected");
      onStatusChange();
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  function renderOutput() {
    if (!job.outputData) return <p className="text-text-muted text-sm">No output data</p>;

    if (job.type === "draft" || job.type === "rewrite") {
      const content = String(job.outputData.content ?? job.outputData.rewritten ?? "");
      return (
        <div>
          {job.type === "rewrite" && !!job.outputData.original && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Original</p>
              <div
                className="bg-admin-bg border border-admin-border rounded-lg p-3 text-sm text-text-muted max-h-40 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: String(job.outputData.original) }}
              />
            </div>
          )}
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Generated Content</p>
          <div
            className="bg-admin-bg border border-admin-border rounded-lg p-3 text-sm max-h-80 overflow-y-auto prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      );
    }

    if (job.type === "seo") {
      const d = job.outputData;
      const fields: { label: string; value: unknown }[] = [
        { label: "SEO Title", value: d.seoTitle },
        { label: "Meta Description", value: d.metaDescription },
        { label: "Slug", value: d.slug },
        { label: "OG Title", value: d.ogTitle },
        { label: "OG Description", value: d.ogDescription },
      ];
      return (
        <div className="space-y-2 text-sm">
          {fields.map(({ label, value }) =>
            value ? (
              <div key={label}>
                <span className="text-text-muted text-xs uppercase tracking-wide font-semibold">{label}: </span>
                <span className="text-text-main">{String(value)}</span>
              </div>
            ) : null
          )}
          {Array.isArray(d.focusKeywords) && d.focusKeywords.length > 0 && (
            <div>
              <span className="text-text-muted text-xs uppercase tracking-wide font-semibold">Focus Keywords: </span>
              <span className="text-text-main">{(d.focusKeywords as string[]).join(", ")}</span>
            </div>
          )}
        </div>
      );
    }

    if (job.type === "faq") {
      const faqs = Array.isArray(job.outputData.faqs)
        ? (job.outputData.faqs as Array<{ question: string; answer: string }>)
        : [];
      return (
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-admin-border rounded-lg p-3">
              <p className="font-semibold text-sm text-text-main">{faq.question}</p>
              <p className="text-sm text-text-muted mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      );
    }

    if (job.type === "summary") {
      return (
        <p className="text-sm text-text-main bg-admin-bg border border-admin-border rounded-lg p-3">
          {String(job.outputData.summary ?? "")}
        </p>
      );
    }

    return (
      <pre className="text-xs bg-admin-bg border border-admin-border rounded-lg p-3 overflow-x-auto">
        {JSON.stringify(job.outputData, null, 2)}
      </pre>
    );
  }

  return (
    <div className="bg-admin-card border border-admin-border rounded-xl shadow-sm">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <Cpu className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-text-main text-sm">{TYPE_LABELS[job.type] ?? job.type}</p>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {formatDate(job.createdAt)}
              {job.requestedBy && ` · by ${job.requestedBy.name}`}
              {job.tokensUsed != null && ` · ${job.tokensUsed.toLocaleString()} tokens`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[job.status] ?? "default"}>{job.status}</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-admin-border px-5 py-4 space-y-4">
          {job.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Error: {job.error}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Input</p>
            <pre className="text-xs bg-admin-bg border border-admin-border rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(job.inputData, null, 2)}
            </pre>
          </div>

          {job.outputData && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Output</p>
              {renderOutput()}
            </div>
          )}

          {job.status === "done" && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={loading !== null}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                {loading === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                disabled={loading !== null}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                {loading === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          )}

          {(job.status === "approved" || job.status === "rejected") && job.approvedBy && (
            <p className="text-xs text-text-muted">
              {job.status === "approved" ? "Approved" : "Rejected"} by {job.approvedBy.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
