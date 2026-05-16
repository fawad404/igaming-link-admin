"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ArticleTable, type ArticleRow } from "@/components/articles/ArticleTable";
import { ArticleFilters } from "@/components/articles/ArticleFilters";
import { usePermission } from "@/hooks/usePermission";

interface Category {
  _id: string;
  name: string;
}

export default function ArticlesPage() {
  const { can } = usePermission();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (category) params.set("category", category);

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, category]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Article archived");
      setDeleteId(null);
      fetchArticles();
    } catch {
      toast.error("Failed to archive article");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Articles</h1>
          <p className="text-sm text-text-muted mt-1">
            {total} article{total !== 1 ? "s" : ""} total
          </p>
        </div>
        {can("articles:create") && (
          <Link href="/admin/articles/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          </Link>
        )}
      </div>

      <ArticleFilters
        search={search}
        status={status}
        category={category}
        categories={categories}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onCategoryChange={(v) => { setCategory(v); setPage(1); }}
        onReset={() => { setSearch(""); setStatus(""); setCategory(""); setPage(1); }}
      />

      <ArticleTable
        articles={articles}
        loading={loading}
        onDelete={can("articles:delete") ? (id) => setDeleteId(id) : undefined}
        canEdit={can("articles:edit")}
      />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Archive Article"
        message="This will archive the article and hide it from the site. You can restore it by editing the article status."
        confirmLabel="Archive"
        loading={deleting}
      />
    </div>
  );
}
