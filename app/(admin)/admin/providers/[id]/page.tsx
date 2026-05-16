"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/Spinner";
import { ProviderForm } from "@/components/providers/ProviderForm";
import { MediaAssetItem } from "@/components/media/MediaGrid";

interface ProviderData {
  _id: string;
  name: string;
  slug: string;
  logo?: MediaAssetItem;
  description?: string;
  website?: string;
  tags: string[];
  regions: string[];
  games: { name: string; type: string }[];
  isActive: boolean;
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

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/providers/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProvider(data);
      } catch {
        toast.error("Failed to load provider");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew]);

  const title = isNew ? "New Provider" : provider?.name ?? "Edit Provider";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/providers"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-admin-bg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isNew ? "Add a new game provider" : "Edit provider details and SEO settings"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <ProviderForm
          mode={isNew ? "create" : "edit"}
          initial={
            isNew
              ? undefined
              : {
                  _id: provider?._id,
                  name: provider?.name,
                  slug: provider?.slug,
                  logo: provider?.logo ?? null,
                  description: provider?.description ?? "",
                  website: provider?.website ?? "",
                  tags: provider?.tags ?? [],
                  regions: provider?.regions ?? [],
                  games: provider?.games ?? [],
                  isActive: provider?.isActive ?? true,
                  seo: provider?.seoSettings
                    ? {
                        title: provider.seoSettings.title,
                        metaDescription: provider.seoSettings.metaDescription,
                        canonicalUrl: provider.seoSettings.canonicalUrl,
                        robots: provider.seoSettings.robots,
                        ogTitle: provider.seoSettings.ogTitle,
                        ogDescription: provider.seoSettings.ogDescription,
                        focusKeywords: provider.seoSettings.focusKeywords,
                        schemaType: provider.seoSettings.schemaType,
                        sitemapInclude: provider.seoSettings.sitemapInclude,
                      }
                    : {},
                }
          }
        />
      )}
    </div>
  );
}
