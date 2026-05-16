"use client";

import { formatDate } from "@/lib/utils";
import { classNames } from "@/lib/utils";

type AuditAction = "created" | "updated" | "deleted" | "published" | "approved" | "generated" | "deployed";

interface ActivityEntry {
  _id: string;
  action: AuditAction;
  entityType: string;
  entityTitle?: string;
  performedBy: { name: string } | null;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityEntry[];
  loading?: boolean;
}

const actionStyles: Record<AuditAction, { label: string; classes: string }> = {
  created: { label: "Created", classes: "bg-info/10 text-info" },
  updated: { label: "Updated", classes: "bg-warning/10 text-warning" },
  deleted: { label: "Deleted", classes: "bg-danger/10 text-danger" },
  published: { label: "Published", classes: "bg-success/10 text-success" },
  approved: { label: "Approved", classes: "bg-state-approved/10 text-state-approved" },
  generated: { label: "Generated", classes: "bg-primary/10 text-primary" },
  deployed: { label: "Deployed", classes: "bg-state-imported/10 text-state-imported" },
};

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-admin-border shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-admin-border rounded" />
              <div className="h-3 w-1/3 bg-admin-border rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-center text-sm text-text-muted py-6">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((entry) => {
        const style = actionStyles[entry.action] ?? actionStyles.updated;
        return (
          <div key={entry._id} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-bg text-xs font-bold text-text-muted uppercase">
              {entry.performedBy?.name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-main leading-snug">
                <span className="font-medium">{entry.performedBy?.name ?? "System"}</span>
                {" "}
                <span className={classNames("inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold", style.classes)}>
                  {style.label}
                </span>
                {" "}
                <span className="text-text-muted">{entry.entityType}</span>
                {entry.entityTitle && (
                  <span className="font-medium"> &quot;{entry.entityTitle}&quot;</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {formatDate(entry.createdAt, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
