"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArticleForm, type ArticleFormData } from "@/components/articles/ArticleForm";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import { type SeoData } from "@/components/seo/SeoFieldsPanel";

interface Revision {
  _id: string;
  content: string;
  changedBy: { name: string } | null;
  changeNote?: string;
  createdAt: string;
}

type Tab = "edit" | "preview" | "revisions";

export default function EditArticlePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [article, setArticle] = useState<ArticleFormData | null>(null);
  const [seoInitial, setSeoInitial] = useState<SeoData | undefined>(undefined);
  const [previewContent, setPreviewContent] = useState("");
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("edit");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => r.json()),
      fetch(`/api/articles/${id}/revisions`).then((r) => r.json()),
    ])
      .then(([art, revs]) => {
        const { seoSettings, content, ...articleData } = art;
        setArticle({ ...articleData, content });
        setPreviewContent(content ?? "");
        if (seoSettings && typeof seoSettings === "object" && !Array.isArray(seoSettings)) {
          setSeoInitial({
            title: seoSettings.title,
            metaDescription: seoSettings.metaDescription,
            canonicalUrl: seoSettings.canonicalUrl,
            robots: seoSettings.robots,
            ogTitle: seoSettings.ogTitle,
            ogDescription: seoSettings.ogDescription,
            focusKeywords: seoSettings.focusKeywords,
            schemaType: seoSettings.schemaType,
            sitemapInclude: seoSettings.sitemapInclude,
          });
        }
        setRevisions(Array.isArray(revs) ? revs : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!article || (article as Record<string, unknown>).error) {
    return (
      <div className="py-24 text-center text-text-muted">Article not found.</div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "edit", label: "Edit" },
    { key: "preview", label: "Preview" },
    { key: "revisions", label: `Revisions (${revisions.length})` },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main truncate">
          {article.title ?? "Edit Article"}
        </h1>
        <p className="text-sm text-text-muted mt-1">Edit article content and metadata</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-admin-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "edit" && (
        <ArticleForm articleId={id} initialData={article} initialSeo={seoInitial} />
      )}

      {tab === "preview" && (
        <div className="rounded-xl border border-admin-border bg-admin-card p-6">
          <div className="mb-4 pb-4 border-b border-admin-border">
            <h2 className="text-xl font-bold text-text-main">{article.title}</h2>
            {article.summary && (
              <p className="mt-2 text-text-muted text-sm">{article.summary}</p>
            )}
          </div>
          {previewContent ? (
            <div
              className="prose prose-sm max-w-none text-text-main"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          ) : (
            <p className="text-text-muted text-sm">No content to preview.</p>
          )}
        </div>
      )}

      {tab === "revisions" && (
        <div className="space-y-3">
          {revisions.length === 0 ? (
            <div className="rounded-xl border border-admin-border bg-admin-card px-5 py-12 text-center text-text-muted">
              No revisions yet. Revisions are saved automatically when you update the content.
            </div>
          ) : (
            revisions.map((rev) => (
              <div
                key={rev._id}
                className="rounded-xl border border-admin-border bg-admin-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <span className="font-medium text-text-main">
                      {rev.changedBy?.name ?? "Unknown"}
                    </span>
                    {rev.changeNote && (
                      <span className="ml-2 text-text-muted">· {rev.changeNote}</span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">
                    {formatDate(rev.createdAt, "MMM d, yyyy · HH:mm")}
                  </span>
                </div>
                <pre className="text-xs text-text-muted font-mono bg-admin-bg rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                  {rev.content.slice(0, 400)}
                  {rev.content.length > 400 ? "…" : ""}
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
