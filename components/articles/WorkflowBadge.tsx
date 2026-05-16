import { Badge } from "@/components/ui/Badge";
import type { ArticleStatus } from "@/lib/models/Article";

const STATUS_CONFIG: Record<ArticleStatus, { variant: "imported" | "draft" | "review" | "approved" | "published" | "archived"; label: string }> = {
  imported: { variant: "imported", label: "Imported" },
  "ai-draft": { variant: "draft", label: "AI Draft" },
  "needs-review": { variant: "review", label: "Needs Review" },
  approved: { variant: "approved", label: "Approved" },
  published: { variant: "published", label: "Published" },
  archived: { variant: "archived", label: "Archived" },
};

interface WorkflowBadgeProps {
  status: ArticleStatus;
}

export function WorkflowBadge({ status }: WorkflowBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { variant: "default" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
