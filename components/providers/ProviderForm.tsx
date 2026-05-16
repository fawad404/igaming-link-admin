"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Globe, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Card } from "@/components/ui/Card";
import { SeoFieldsPanel, SeoData } from "@/components/seo/SeoFieldsPanel";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { MediaAssetItem } from "@/components/media/MediaGrid";
import { slugify } from "@/lib/utils";

interface Game {
  name: string;
  type: string;
}

interface ProviderFormData {
  name: string;
  slug: string;
  logo: MediaAssetItem | null;
  description: string;
  website: string;
  tags: string[];
  regions: string[];
  games: Game[];
  isActive: boolean;
  seo: SeoData;
}

interface ProviderFormProps {
  initial?: Partial<ProviderFormData> & { _id?: string };
  mode: "create" | "edit";
}

const GAME_TYPES = ["Slots", "Table Games", "Live Casino", "Sports Betting", "Poker", "Bingo", "Lottery", "Virtual Sports", "Other"];

export function ProviderForm({ initial, mode }: ProviderFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [form, setForm] = useState<ProviderFormData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    logo: initial?.logo ?? null,
    description: initial?.description ?? "",
    website: initial?.website ?? "",
    tags: initial?.tags ?? [],
    regions: initial?.regions ?? [],
    games: initial?.games ?? [],
    isActive: initial?.isActive ?? true,
    seo: initial?.seo ?? {},
  });

  const [tagInput, setTagInput] = useState("");
  const [regionInput, setRegionInput] = useState("");

  function set<K extends keyof ProviderFormData>(key: K, val: ProviderFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug || slugify(name),
    }));
  }

  // Tags
  function addTag() {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    set("tags", [...form.tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    set("tags", form.tags.filter((x) => x !== t));
  }

  // Regions
  function addRegion() {
    const r = regionInput.trim();
    if (!r || form.regions.includes(r)) return;
    set("regions", [...form.regions, r]);
    setRegionInput("");
  }

  function removeRegion(r: string) {
    set("regions", form.regions.filter((x) => x !== r));
  }

  // Games
  function addGame() {
    set("games", [...form.games, { name: "", type: "Slots" }]);
  }

  function updateGame(idx: number, field: keyof Game, val: string) {
    const updated = form.games.map((g, i) => (i === idx ? { ...g, [field]: val } : g));
    set("games", updated);
  }

  function removeGame(idx: number) {
    set("games", form.games.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Provider name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        logo: form.logo?._id ?? null,
        description: form.description,
        website: form.website,
        tags: form.tags,
        regions: form.regions,
        games: form.games.filter((g) => g.name.trim()),
        isActive: form.isActive,
        seo: form.seo,
      };

      const url = mode === "edit" ? `/api/providers/${initial?._id}` : "/api/providers";
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

      toast.success(mode === "edit" ? "Provider updated" : "Provider created");
      router.push("/admin/providers");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <div className="space-y-4">
          <h2 className="font-semibold text-text-main">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Provider Name *"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Evolution Gaming"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-generated from name"
            />
          </div>
          <Input
            label="Website URL"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://example.com"
          />
          <div className="flex items-start gap-3 pt-1">
            <Globe className="h-4 w-4 text-text-muted mt-7 shrink-0" />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Brief description of this provider…"
            />
          </div>
        </div>
      </Card>

      {/* Logo */}
      <Card>
        <div className="space-y-3">
          <h2 className="font-semibold text-text-main">Logo</h2>
          {form.logo ? (
            <div className="flex items-center gap-4">
              <img
                src={form.logo.url}
                alt={form.logo.altText ?? form.logo.originalName}
                className="h-20 w-20 rounded-lg object-contain border border-admin-border bg-admin-bg p-1"
              />
              <div className="text-sm text-text-muted">{form.logo.originalName}</div>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                  Change
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => set("logo", null)}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-3 rounded-xl border-2 border-dashed border-admin-border bg-admin-bg px-5 py-6 text-sm text-text-muted hover:border-primary hover:text-primary transition-colors w-full"
            >
              <ImageIcon className="h-5 w-5" />
              Click to select logo from media library
            </button>
          )}
        </div>
      </Card>

      {/* Tags */}
      <Card>
        <div className="space-y-3">
          <h2 className="font-semibold text-text-main">Tags</h2>
          <div className="flex flex-wrap gap-2 min-h-[28px]">
            {form.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 bg-admin-bg border border-admin-border rounded-full px-2.5 py-0.5 text-xs text-text-main"
              >
                {t}
                <button type="button" onClick={() => removeTag(t)} className="text-text-muted hover:text-danger ml-0.5 leading-none">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tag and press Enter"
              className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
          </div>
        </div>
      </Card>

      {/* Regions */}
      <Card>
        <div className="space-y-3">
          <h2 className="font-semibold text-text-main">Regions</h2>
          <div className="flex flex-wrap gap-2 min-h-[28px]">
            {form.regions.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1 bg-info/10 border border-info/30 rounded-full px-2.5 py-0.5 text-xs text-info"
              >
                {r}
                <button type="button" onClick={() => removeRegion(r)} className="text-info/60 hover:text-danger ml-0.5 leading-none">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={regionInput}
              onChange={(e) => setRegionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRegion(); } }}
              placeholder="e.g. Europe, Malta, UK — press Enter"
              className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addRegion}>Add</Button>
          </div>
        </div>
      </Card>

      {/* Games */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-main">Games</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addGame}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Game
            </Button>
          </div>
          {form.games.length === 0 ? (
            <p className="text-sm text-text-muted">No games added yet.</p>
          ) : (
            <div className="space-y-2">
              {form.games.map((game, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={game.name}
                    onChange={(e) => updateGame(idx, "name", e.target.value)}
                    placeholder="Game name"
                    className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={game.type}
                    onChange={(e) => updateGame(idx, "type", e.target.value)}
                    className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {GAME_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeGame(idx)}
                    className="p-2 text-text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Status */}
      <Card>
        <div className="flex items-center gap-3">
          <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
          <div>
            <p className="text-sm font-medium text-text-main">Active</p>
            <p className="text-xs text-text-muted">Inactive providers are hidden from the public website</p>
          </div>
        </div>
      </Card>

      {/* SEO */}
      <SeoFieldsPanel value={form.seo} onChange={(seo) => set("seo", seo)} />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/providers")}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Provider"}
        </Button>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset: MediaAssetItem) => set("logo", asset)}
        selectedId={form.logo?._id}
      />
    </form>
  );
}
