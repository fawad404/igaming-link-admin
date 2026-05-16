"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/Spinner";
import { BannerForm } from "@/components/partners/BannerForm";

interface BannerData {
  _id: string;
  name: string;
  image?: { _id: string; url: string; originalName: string } | null;
  targetUrl: string;
  position?: string;
  utmCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  geoTargets: string[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/partners/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setBanner(data);
      } catch {
        toast.error("Failed to load banner");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew]);

  const title = isNew ? "New Banner" : banner?.name ?? "Edit Banner";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/partners"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-admin-bg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isNew ? "Create a new partner banner" : "Edit banner details and targeting"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <BannerForm
          mode={isNew ? "create" : "edit"}
          initial={
            isNew
              ? undefined
              : {
                  _id: banner?._id,
                  name: banner?.name,
                  image: banner?.image ?? null,
                  targetUrl: banner?.targetUrl ?? "",
                  position: banner?.position ?? "sidebar",
                  utmCampaign: banner?.utmCampaign ?? "",
                  utmSource: banner?.utmSource ?? "",
                  utmMedium: banner?.utmMedium ?? "",
                  geoTargets: banner?.geoTargets ?? [],
                  isActive: banner?.isActive ?? true,
                  startDate: banner?.startDate ? banner.startDate.split("T")[0] : "",
                  endDate: banner?.endDate ? banner.endDate.split("T")[0] : "",
                }
          }
        />
      )}
    </div>
  );
}
