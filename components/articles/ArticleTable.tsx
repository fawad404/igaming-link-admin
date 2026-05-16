import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { WorkflowBadge } from "@/components/articles/WorkflowBadge";
import { formatDate } from "@/lib/utils";
import type { ArticleStatus } from "@/lib/models/Article";

export interface ArticleRow {
  _id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  category?: { name: string } | null;
  author?: { name: string } | null;
  isFeatured: boolean;
  createdAt: string;
  publishedAt?: string | null;
}

interface ArticleTableProps {
  articles: ArticleRow[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

export function ArticleTable({ articles, loading, onDelete, canEdit = true }: ArticleTableProps) {
  const columns = [
    {
      key: "title",
      header: "Title",
      render: (row: ArticleRow) => (
        <div>
          <Link
            href={`/admin/articles/${row._id}`}
            className="font-medium text-text-main hover:text-primary transition-colors"
          >
            {row.title}
          </Link>
          <p className="text-xs text-text-muted mt-0.5 font-mono">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: ArticleRow) => <WorkflowBadge status={row.status} />,
    },
    {
      key: "category",
      header: "Category",
      render: (row: ArticleRow) => (
        <span className="text-text-muted">{row.category?.name ?? "—"}</span>
      ),
    },
    {
      key: "author",
      header: "Author",
      render: (row: ArticleRow) => (
        <span className="text-text-muted">{row.author?.name ?? "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row: ArticleRow) => (
        <span className="text-text-muted text-xs">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row: ArticleRow) => (
        <div className="flex items-center gap-0.5">
          {canEdit && (
            <Link href={`/admin/articles/${row._id}`}>
              <Button variant="ghost" size="sm" className="p-1.5">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-danger hover:bg-red-50"
              onClick={() => onDelete(row._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={articles}
      loading={loading}
      keyExtractor={(row) => row._id}
      emptyMessage="No articles found. Create your first article."
    />
  );
}
