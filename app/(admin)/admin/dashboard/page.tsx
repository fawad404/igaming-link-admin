"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  Layers,
  Shield,
  Image,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card } from "@/components/ui/Card";
import { classNames } from "@/lib/utils";

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  reviewArticles: number;
  providers: number;
  licenses: number;
  mediaFiles: number;
  aiJobsPending: number;
}

interface ArticlesByStatus {
  imported: number;
  "ai-draft": number;
  "needs-review": number;
  approved: number;
  published: number;
  archived: number;
}

interface ActivityEntry {
  _id: string;
  action: "created" | "updated" | "deleted" | "published" | "approved" | "generated" | "deployed";
  entityType: string;
  entityTitle?: string;
  performedBy: { name: string } | null;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  articlesByStatus: ArticlesByStatus;
  recentActivity: ActivityEntry[];
}

const statusConfig: {
  key: keyof ArticlesByStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "imported", label: "Imported", color: "bg-state-imported", bg: "bg-state-imported/10" },
  { key: "ai-draft", label: "AI Draft", color: "bg-state-draft", bg: "bg-state-draft/10" },
  { key: "needs-review", label: "Needs Review", color: "bg-state-review", bg: "bg-state-review/10" },
  { key: "approved", label: "Approved", color: "bg-state-approved", bg: "bg-state-approved/10" },
  { key: "published", label: "Published", color: "bg-state-published", bg: "bg-state-published/10" },
  { key: "archived", label: "Archived", color: "bg-state-archived", bg: "bg-state-archived/10" },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalForStatusBar = data
    ? Object.values(data.articlesByStatus).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-main">Dashboard</h2>
        <p className="text-sm text-text-muted mt-1">
          Welcome back — here&apos;s an overview of your platform.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          Failed to load dashboard data: {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <StatCard
          label="Total Articles"
          value={data?.stats.totalArticles ?? 0}
          icon={FileText}
          iconColor="text-primary"
          loading={loading}
        />
        <StatCard
          label="Published"
          value={data?.stats.publishedArticles ?? 0}
          icon={CheckCircle}
          iconColor="text-success"
          loading={loading}
        />
        <StatCard
          label="In Review"
          value={data?.stats.reviewArticles ?? 0}
          icon={Clock}
          iconColor="text-warning"
          loading={loading}
        />
        <StatCard
          label="Providers"
          value={data?.stats.providers ?? 0}
          icon={Layers}
          iconColor="text-info"
          loading={loading}
        />
        <StatCard
          label="Licenses"
          value={data?.stats.licenses ?? 0}
          icon={Shield}
          iconColor="text-state-approved"
          loading={loading}
        />
        <StatCard
          label="Media Files"
          value={data?.stats.mediaFiles ?? 0}
          icon={Image}
          iconColor="text-text-muted"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card header="Recent Activity">
            <ActivityFeed
              activities={data?.recentActivity ?? []}
              loading={loading}
            />
          </Card>

          {/* Content by Status */}
          <Card header="Content by Status">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-24 rounded bg-admin-border" />
                    <div className="flex-1 h-3 rounded bg-admin-border" />
                    <div className="h-3 w-8 rounded bg-admin-border" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {statusConfig.map(({ key, label, color, bg }) => {
                  const count = data?.articlesByStatus[key] ?? 0;
                  const pct = totalForStatusBar > 0 ? (count / totalForStatusBar) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-text-muted">{label}</span>
                      <div className="flex-1 rounded-full bg-admin-border h-2 overflow-hidden">
                        <div
                          className={classNames("h-full rounded-full transition-all duration-500", color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={classNames("w-8 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold", bg)}>
                        {count}
                      </span>
                    </div>
                  );
                })}
                {totalForStatusBar === 0 && (
                  <p className="text-center text-sm text-text-muted py-2">No articles yet.</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card header="Quick Actions">
            <QuickActions />
          </Card>

          {/* AI Jobs Pending */}
          {!loading && (data?.stats.aiJobsPending ?? 0) > 0 && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">
                {data!.stats.aiJobsPending} AI job{data!.stats.aiJobsPending !== 1 ? "s" : ""} pending review
              </p>
              <p className="text-xs text-text-muted mt-1">
                Head to AI Content to approve or reject generated drafts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
