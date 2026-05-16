"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/Spinner";
import { LicenseForm } from "@/components/licenses/LicenseForm";

interface LicenseData {
  _id: string;
  name: string;
  slug: string;
  jurisdiction?: string;
  description?: string;
  requirements?: string;
  complianceNotes?: string;
  fees?: string;
  licenceTypes?: string[];
  processingTime?: string;
  bestFor?: string;
  faqs: { question: string; answer: string }[];
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

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [license, setLicense] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/licenses/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setLicense(data);
      } catch {
        toast.error("Failed to load license");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew]);

  const title = isNew ? "New License" : license?.name ?? "Edit License";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/licenses"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-admin-bg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isNew ? "Add a new license/jurisdiction" : "Edit license details and SEO settings"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <LicenseForm
          mode={isNew ? "create" : "edit"}
          initial={
            isNew
              ? undefined
              : {
                  _id: license?._id,
                  name: license?.name,
                  slug: license?.slug,
                  jurisdiction: license?.jurisdiction ?? "",
                  description: license?.description ?? "",
                  requirements: license?.requirements ?? "",
                  complianceNotes: license?.complianceNotes ?? "",
                  fees: license?.fees ?? "",
                  licenceTypes: license?.licenceTypes ?? [],
                  processingTime: license?.processingTime ?? "",
                  bestFor: license?.bestFor ?? "",
                  faqs: license?.faqs ?? [],
                  isActive: license?.isActive ?? true,
                  seo: license?.seoSettings
                    ? {
                        title: license.seoSettings.title,
                        metaDescription: license.seoSettings.metaDescription,
                        canonicalUrl: license.seoSettings.canonicalUrl,
                        robots: license.seoSettings.robots,
                        ogTitle: license.seoSettings.ogTitle,
                        ogDescription: license.seoSettings.ogDescription,
                        focusKeywords: license.seoSettings.focusKeywords,
                        schemaType: license.seoSettings.schemaType,
                        sitemapInclude: license.seoSettings.sitemapInclude,
                      }
                    : {},
                }
          }
        />
      )}
    </div>
  );
}
