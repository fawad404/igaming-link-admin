"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Card } from "@/components/ui/Card";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { MediaAssetItem } from "@/components/media/MediaGrid";

const POSITION_OPTIONS = [
  { value: "homepage",  label: "Homepage",          desc: "Banners on the homepage" },
  { value: "news",      label: "News Page",         desc: "Banners on the news listing & detail pages" },
  { value: "blogs",     label: "Blogs Page",        desc: "Banners on the blogs listing & detail pages" },
  { value: "article",   label: "Article Sidebar",   desc: "Sidebar banners on individual article pages" },
  { value: "providers", label: "Providers Page",    desc: "Banners on providers listing & detail" },
  { value: "licenses",  label: "Licenses Page",     desc: "Banners on license listing & detail" },
  { value: "events",    label: "Events Page",       desc: "Banners on the events page" },
  { value: "casinos",   label: "Casinos Page",      desc: "Banners on casino listing & detail" },
  { value: "partners",  label: "Partners Page",     desc: "Banners shown on the partners page" },
  { value: "sidebar",   label: "Generic Sidebar",   desc: "Shown on about, contact, legal, search pages" },
  { value: "navbar",    label: "Navbar Banner",     desc: "Top of page navbar advertisement banner" },
];

const GEO_OPTIONS = [
  "Global", "US", "UK", "CA", "AU", "DE", "FR", "ES", "IT", "NL",
  "SE", "NO", "DK", "FI", "PL", "PT", "BR", "MX", "IN", "JP",
  "KR", "SG", "NZ", "ZA", "IE", "MT", "GI", "CY",
];

interface BannerFormData {
  name: string;
  image: { _id: string; url: string; originalName: string } | null;
  targetUrl: string;
  position: string;
  utmCampaign: string;
  utmSource: string;
  utmMedium: string;
  geoTargets: string[];
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface BannerFormProps {
  initial?: Partial<BannerFormData> & { _id?: string };
  mode: "create" | "edit";
}

export function BannerForm({ initial, mode }: BannerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [form, setForm] = useState<BannerFormData>({
    name: initial?.name ?? "",
    image: initial?.image ?? null,
    targetUrl: initial?.targetUrl ?? "",
    position: initial?.position ?? "sidebar",
    utmCampaign: initial?.utmCampaign ?? "",
    utmSource: initial?.utmSource ?? "",
    utmMedium: initial?.utmMedium ?? "",
    geoTargets: initial?.geoTargets ?? [],
    isActive: initial?.isActive ?? true,
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
  });

  function set<K extends keyof BannerFormData>(key: K, val: BannerFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleImageSelect(asset: MediaAssetItem) {
    set("image", { _id: asset._id, url: asset.url, originalName: asset.originalName });
  }

  function toggleGeo(country: string) {
    setForm((f) => ({
      ...f,
      geoTargets: f.geoTargets.includes(country)
        ? f.geoTargets.filter((g) => g !== country)
        : [...f.geoTargets, country],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Banner name is required");
      return;
    }
    if (!form.targetUrl.trim()) {
      toast.error("Target URL is required");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        image: form.image?._id ?? null,
        targetUrl: form.targetUrl,
        position: form.position,
        utmCampaign: form.utmCampaign,
        utmSource: form.utmSource,
        utmMedium: form.utmMedium,
        geoTargets: form.geoTargets,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const url = mode === "edit" ? `/api/partners/${initial?._id}` : "/api/partners";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      toast.success(mode === "edit" ? "Banner updated" : "Banner created");
      router.push("/admin/partners");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-semibold text-text-main">Banner Details</h2>
            <Input
              label="Banner Name *"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Bet365 Homepage Banner"
            />
            <Input
              label="Target URL *"
              value={form.targetUrl}
              onChange={(e) => set("targetUrl", e.target.value)}
              placeholder="https://example.com/landing"
            />
          </div>
        </Card>

        {/* Position */}
        <Card>
          <div className="space-y-3">
            <div>
              <h2 className="font-semibold text-text-main">Ad Placement Position *</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Choose where this banner will appear on the website. Each page pulls banners assigned to its position.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("position", opt.value)}
                  className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                    form.position === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-admin-border bg-admin-bg hover:border-primary/50"
                  }`}
                >
                  <p className={`text-xs font-semibold ${form.position === opt.value ? "text-primary" : "text-text-main"}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Banner Image */}
        <Card>
          <div className="space-y-3">
            <h2 className="font-semibold text-text-main">Banner Image</h2>
            {form.image ? (
              <div className="relative inline-block">
                <div className="relative w-full max-w-md h-40 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
                  <Image
                    src={form.image.url}
                    alt={form.image.originalName}
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set("image", null)}
                  className="absolute -top-2 -right-2 rounded-full bg-danger p-1 text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="mt-1.5 text-xs text-text-muted">{form.image.originalName}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex flex-col items-center justify-center gap-2 w-full max-w-md h-40 rounded-lg border-2 border-dashed border-admin-border bg-admin-bg hover:border-primary hover:bg-primary/5 transition-colors text-text-muted"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">Click to select banner image</span>
              </button>
            )}
            {form.image && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                Change Image
              </Button>
            )}
          </div>
        </Card>

        {/* UTM Tracking */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-semibold text-text-main">UTM Tracking</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="UTM Campaign"
                value={form.utmCampaign}
                onChange={(e) => set("utmCampaign", e.target.value)}
                placeholder="e.g. summer-promo"
              />
              <Input
                label="UTM Source"
                value={form.utmSource}
                onChange={(e) => set("utmSource", e.target.value)}
                placeholder="e.g. igaminglink"
              />
              <Input
                label="UTM Medium"
                value={form.utmMedium}
                onChange={(e) => set("utmMedium", e.target.value)}
                placeholder="e.g. banner"
              />
            </div>
            {(form.utmCampaign || form.utmSource || form.utmMedium) && (
              <div className="rounded-lg bg-admin-bg border border-admin-border px-3 py-2">
                <p className="text-xs text-text-muted font-mono break-all">
                  {form.targetUrl || "https://example.com"}
                  {form.utmSource ? `?utm_source=${form.utmSource}` : ""}
                  {form.utmMedium ? `&utm_medium=${form.utmMedium}` : ""}
                  {form.utmCampaign ? `&utm_campaign=${form.utmCampaign}` : ""}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-semibold text-text-main">Schedule</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
            <p className="text-xs text-text-muted">Leave empty to run indefinitely.</p>
          </div>
        </Card>

        {/* Geo Targeting */}
        <Card>
          <div className="space-y-3">
            <div>
              <h2 className="font-semibold text-text-main">Geo Targeting</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Select countries where this banner should be shown. Leave empty to show globally.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GEO_OPTIONS.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => toggleGeo(country)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    form.geoTargets.includes(country)
                      ? "bg-primary text-white border-primary"
                      : "bg-admin-bg text-text-muted border-admin-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
            {form.geoTargets.length > 0 && (
              <p className="text-xs text-text-muted">
                {form.geoTargets.length} countr{form.geoTargets.length !== 1 ? "ies" : "y"} selected
              </p>
            )}
          </div>
        </Card>

        {/* Status */}
        <Card>
          <div className="flex items-center gap-3">
            <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
            <div>
              <p className="text-sm font-medium text-text-main">Active</p>
              <p className="text-xs text-text-muted">Inactive banners are not served on the website</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/partners")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Banner"}
          </Button>
        </div>
      </form>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleImageSelect}
        selectedId={form.image?._id}
      />
    </>
  );
}
