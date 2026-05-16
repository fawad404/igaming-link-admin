"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, X, Plus } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { MediaAssetItem } from "@/components/media/MediaGrid";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EVENT_TYPE_OPTIONS = [
  { value: "conference", label: "Conference" },
  { value: "exhibition", label: "Exhibition" },
  { value: "webinar",    label: "Webinar" },
  { value: "networking", label: "Networking" },
  { value: "awards",     label: "Awards" },
  { value: "other",      label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "upcoming",   label: "Upcoming" },
  { value: "ongoing",    label: "Ongoing" },
  { value: "past",       label: "Past" },
  { value: "cancelled",  label: "Cancelled" },
];

interface EventFormData {
  title: string;
  slug: string;
  description: string;
  image: { _id: string; url: string; originalName: string } | null;
  eventType: string;
  startDate: string;
  endDate: string;
  location: { city: string; country: string; venue: string; isOnline: boolean };
  websiteUrl: string;
  isFeatured: boolean;
  isTrending: boolean;
  status: string;
  tags: string[];
}

interface EventFormProps {
  initial?: Partial<EventFormData> & { _id?: string };
  mode: "create" | "edit";
}

export function EventForm({ initial, mode }: EventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState<EventFormData>({
    title:       initial?.title ?? "",
    slug:        initial?.slug ?? "",
    description: initial?.description ?? "",
    image:       initial?.image ?? null,
    eventType:   initial?.eventType ?? "conference",
    startDate:   initial?.startDate ?? "",
    endDate:     initial?.endDate ?? "",
    location: {
      city:     initial?.location?.city ?? "",
      country:  initial?.location?.country ?? "",
      venue:    initial?.location?.venue ?? "",
      isOnline: initial?.location?.isOnline ?? false,
    },
    websiteUrl:  initial?.websiteUrl ?? "",
    isFeatured:  initial?.isFeatured ?? false,
    isTrending:  initial?.isTrending ?? false,
    status:      initial?.status ?? "upcoming",
    tags:        initial?.tags ?? [],
  });

  function set<K extends keyof EventFormData>(key: K, val: EventFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function setLocation(key: keyof EventFormData["location"], val: string | boolean) {
    setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }));
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: mode === "create" ? slugify(title) : f.slug }));
  }

  function handleImageSelect(asset: MediaAssetItem) {
    set("image", { _id: asset._id, url: asset.url, originalName: asset.originalName });
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", form.tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    if (!form.startDate) { toast.error("Start date is required"); return; }
    if (!form.endDate) { toast.error("End date is required"); return; }
    if (form.endDate < form.startDate) { toast.error("End date cannot be before start date"); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        image: form.image?._id ?? null,
      };

      const url    = mode === "edit" ? `/api/events/${initial?._id}` : "/api/events";
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

      toast.success(mode === "edit" ? "Event updated" : "Event created");
      router.push("/admin/events");
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
            <h2 className="font-semibold text-text-main">Event Details</h2>
            <Input
              label="Event Title *"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. SiGMA Europe 2026"
            />
            <Input
              label="Slug *"
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="sigma-europe-2026"
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Brief description of the event…"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Event Type"
                value={form.eventType}
                onChange={(e) => set("eventType", e.target.value)}
                options={EVENT_TYPE_OPTIONS}
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
            <Input
              label="Event Website URL"
              value={form.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="https://sigma.world"
            />
          </div>
        </Card>

        {/* Dates */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-semibold text-text-main">Dates</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Start Date *"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              <Input
                label="End Date *"
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-main">Location</h2>
              <div className="flex items-center gap-2">
                <Toggle checked={form.location.isOnline} onChange={(v) => setLocation("isOnline", v)} />
                <span className="text-sm text-text-muted">Online event</span>
              </div>
            </div>
            {!form.location.isOnline && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="City"
                  value={form.location.city}
                  onChange={(e) => setLocation("city", e.target.value)}
                  placeholder="Las Vegas"
                />
                <Input
                  label="Country"
                  value={form.location.country}
                  onChange={(e) => setLocation("country", e.target.value)}
                  placeholder="USA"
                />
                <Input
                  label="Venue"
                  value={form.location.venue}
                  onChange={(e) => setLocation("venue", e.target.value)}
                  placeholder="MGM Grand"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Cover Image */}
        <Card>
          <div className="space-y-3">
            <h2 className="font-semibold text-text-main">Cover Image</h2>
            {form.image ? (
              <div className="relative inline-block">
                <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
                  <Image src={form.image.url} alt={form.image.originalName} fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => set("image", null)}
                  className="absolute -top-2 -right-2 rounded-full bg-danger p-1 text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex flex-col items-center justify-center gap-2 w-full max-w-md h-48 rounded-lg border-2 border-dashed border-admin-border bg-admin-bg hover:border-primary hover:bg-primary/5 transition-colors text-text-muted"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">Click to select cover image</span>
              </button>
            )}
            {form.image && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                Change Image
              </Button>
            )}
          </div>
        </Card>

        {/* Tags */}
        <Card>
          <div className="space-y-3">
            <h2 className="font-semibold text-text-main">Tags</h2>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-danger transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Visibility */}
        <Card>
          <div className="space-y-3">
            <h2 className="font-semibold text-text-main">Visibility</h2>
            <div className="flex items-center gap-3">
              <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <div>
                <p className="text-sm font-medium text-text-main">Featured</p>
                <p className="text-xs text-text-muted">Show this event in the featured events section on the website</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={form.isTrending} onChange={(v) => set("isTrending", v)} />
              <div>
                <p className="text-sm font-medium text-text-main">Trending</p>
                <p className="text-xs text-text-muted">Show this event in the trending events sidebar</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/events")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Event"}
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
