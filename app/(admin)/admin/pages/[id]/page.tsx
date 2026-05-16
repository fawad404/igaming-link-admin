"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/Spinner";
import { PageForm } from "@/components/pages/PageForm";

interface PageData {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  sections: { type: string; order: number; data: Record<string, unknown> }[];
  isVisible: boolean;
  seoSettings?: {
    title?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    robots?: "index" | "noindex";
    ogTitle?: string;
    ogDescription?: string;
    focusKeywords?: string[];
    schemaType?: string;
    sitemapInclude?: boolean;
  };
}

export default function PageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/pages/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPageData(data);
      } catch {
        toast.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew]);

  const title = isNew ? "New Page" : pageData?.title ?? "Edit Page";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/pages"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-admin-bg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isNew ? "Create a new static page" : "Edit page content and SEO settings"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <PageForm
          mode={isNew ? "create" : "edit"}
          initial={
            isNew
              ? undefined
              : {
                  _id: pageData?._id,
                  title: pageData?.title,
                  slug: pageData?.slug,
                  content: pageData?.content ?? "",
                  sections: pageData?.sections ?? [],
                  isVisible: pageData?.isVisible ?? true,
                  seo: pageData?.seoSettings
                    ? {
                        title: pageData.seoSettings.title,
                        metaDescription: pageData.seoSettings.metaDescription,
                        canonicalUrl: pageData.seoSettings.canonicalUrl,
                        robots: pageData.seoSettings.robots,
                        ogTitle: pageData.seoSettings.ogTitle,
                        ogDescription: pageData.seoSettings.ogDescription,
                        focusKeywords: pageData.seoSettings.focusKeywords,
                        schemaType: pageData.seoSettings.schemaType,
                        sitemapInclude: pageData.seoSettings.sitemapInclude,
                      }
                    : {},
                }
          }
        />
      )}
    </div>
  );
}
