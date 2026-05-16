"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, ClipboardList, History, AlertCircle } from "lucide-react";
import { AiGeneratePanel } from "@/components/ai/AiGeneratePanel";
import { AiApprovalCard } from "@/components/ai/AiApprovalCard";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

type Tab = "generate" | "review" | "history";

interface GenerateResult {
  jobId: string;
  type: string;
  data: Record<string, unknown>;
  tokensUsed: number;
}

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

const TAB_LABELS: Record<Tab, string> = {
  generate: "Generate",
  review: "Review Queue",
  history: "History",
};

export default function AiPage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [latestResult, setLatestResult] = useState<GenerateResult | null>(null);

  // review queue
  const [reviewJobs, setReviewJobs] = useState<AIJobRecord[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);

  // history
  const [historyJobs, setHistoryJobs] = useState<AIJobRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyType, setHistoryType] = useState("");

  const fetchReview = useCallback(async () => {
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/ai/jobs?status=done&page=${reviewPage}&limit=10`);
      const data = await res.json();
      setReviewJobs(data.jobs ?? []);
      setReviewTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setReviewLoading(false);
    }
  }, [reviewPage]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ page: String(historyPage), limit: "15" });
      if (historyType) params.set("type", historyType);
      const res = await fetch(`/api/ai/jobs?${params}`);
      const data = await res.json();
      setHistoryJobs(data.jobs ?? []);
      setHistoryTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyType]);

  useEffect(() => {
    if (activeTab === "review") fetchReview();
  }, [activeTab, fetchReview]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  function handleGenerated(result: GenerateResult) {
    setLatestResult(result);
    setActiveTab("review");
    setTimeout(fetchReview, 500);
  }

  const tabs: Tab[] = ["generate", "review", "history"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">AI Content Manager</h1>
        <p className="text-text-muted text-sm mt-1">
          Generate, review, and approve AI-assisted content before it goes live.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-admin-border">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            {tab === "generate" && <Sparkles className="h-4 w-4" />}
            {tab === "review" && <ClipboardList className="h-4 w-4" />}
            {tab === "history" && <History className="h-4 w-4" />}
            {TAB_LABELS[tab]}
            {tab === "review" && reviewTotal > 0 && (
              <Badge variant="warning">{reviewTotal}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Generate tab */}
      {activeTab === "generate" && (
        <div className="bg-admin-card border border-admin-border rounded-xl shadow-sm p-6">
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-sm text-blue-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Generated content is saved as an AI job and must be reviewed and approved before use.
              Set your AI API key in <strong>Settings → AI</strong>.
            </span>
          </div>
          <AiGeneratePanel onResult={handleGenerated} />

          {latestResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <strong>Generation complete!</strong> Job{" "}
              <code className="bg-green-100 px-1 rounded">{latestResult.jobId}</code> saved. Used{" "}
              <strong>{latestResult.tokensUsed.toLocaleString()}</strong> tokens. Switch to{" "}
              <strong>Review Queue</strong> to approve it.
            </div>
          )}
        </div>
      )}

      {/* Review Queue tab */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {reviewLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : reviewJobs.length === 0 ? (
            <div className="bg-admin-card border border-admin-border rounded-xl shadow-sm p-12 text-center">
              <ClipboardList className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No jobs awaiting review.</p>
              <p className="text-sm text-text-muted mt-1">
                Generate content from the Generate tab to see it here.
              </p>
            </div>
          ) : (
            <>
              {reviewJobs.map(job => (
                <AiApprovalCard key={job._id} job={job} onStatusChange={fetchReview} />
              ))}
              {reviewTotal > 10 && (
                <Pagination
                  page={reviewPage}
                  totalPages={Math.ceil(reviewTotal / 10)}
                  onPageChange={setReviewPage}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <Select
                label=""
                value={historyType}
                onChange={e => {
                  setHistoryType(e.target.value);
                  setHistoryPage(1);
                }}
                options={[
                  { value: "", label: "All types" },
                  { value: "draft", label: "Article Draft" },
                  { value: "rewrite", label: "Rewrite" },
                  { value: "seo", label: "SEO Metadata" },
                  { value: "faq", label: "FAQ List" },
                  { value: "summary", label: "Summary" },
                  { value: "schema", label: "Schema / Structured Data" },
                  { value: "gaps", label: "Content Gap Suggestions" },
                ]}
              />
            </div>
            <p className="text-sm text-text-muted">{historyTotal} total jobs</p>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : historyJobs.length === 0 ? (
            <div className="bg-admin-card border border-admin-border rounded-xl shadow-sm p-12 text-center">
              <History className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No AI job history yet.</p>
            </div>
          ) : (
            <>
              {historyJobs.map(job => (
                <AiApprovalCard key={job._id} job={job} onStatusChange={fetchHistory} />
              ))}
              {historyTotal > 15 && (
                <Pagination
                  page={historyPage}
                  totalPages={Math.ceil(historyTotal / 15)}
                  onPageChange={setHistoryPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
