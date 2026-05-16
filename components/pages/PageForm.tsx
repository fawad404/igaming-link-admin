"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Card } from "@/components/ui/Card";
import { SeoFieldsPanel, SeoData } from "@/components/seo/SeoFieldsPanel";
import { slugify } from "@/lib/utils";

interface PageSection {
  type: string;
  order: number;
  data: Record<string, unknown>;
}

interface PageFormData {
  title: string;
  slug: string;
  content: string;
  sections: PageSection[];
  isVisible: boolean;
  seo: SeoData;
}

interface PageFormProps {
  initial?: Partial<PageFormData> & { _id?: string };
  mode: "create" | "edit";
}

const SECTION_TYPES = [
  "hero",
  "features",
  "cta",
  "testimonials",
  "faq",
  "content-block",
  "image-text",
  "stats",
  "custom",
];

export function PageForm({ initial, mode }: PageFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<PageFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    content: initial?.content ?? "",
    sections: initial?.sections ?? [],
    isVisible: initial?.isVisible ?? true,
    seo: initial?.seo ?? {},
  });

  function set<K extends keyof PageFormData>(key: K, val: PageFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug || slugify(title),
    }));
  }

  function addSection() {
    const order = form.sections.length;
    set("sections", [...form.sections, { type: "content-block", order, data: {} }]);
  }

  function updateSection(idx: number, field: keyof PageSection, val: unknown) {
    const updated = form.sections.map((s, i) =>
      i === idx ? { ...s, [field]: val } : s
    );
    set("sections", updated);
  }

  function updateSectionData(idx: number, key: string, val: string) {
    const updated = form.sections.map((s, i) =>
      i === idx ? { ...s, data: { ...s.data, [key]: val } } : s
    );
    set("sections", updated);
  }

  function removeSection(idx: number) {
    const updated = form.sections
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, order: i }));
    set("sections", updated);
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= form.sections.length) return;
    const updated = [...form.sections];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    set("sections", updated.map((s, i) => ({ ...s, order: i })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Page title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        content: form.content,
        sections: form.sections,
        isVisible: form.isVisible,
        seo: form.seo,
      };

      const url = mode === "edit" ? `/api/pages/${initial?._id}` : "/api/pages";
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

      toast.success(mode === "edit" ? "Page updated" : "Page created");
      router.push("/admin/pages");
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
              label="Page Title *"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. About Us"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-generated from title"
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card>
        <div className="space-y-3">
          <h2 className="font-semibold text-text-main">Page Content</h2>
          <p className="text-xs text-text-muted">
            Main page content (HTML supported). For pages with structured sections, use the Sections builder below.
          </p>
          <Textarea
            label=""
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={10}
            placeholder="Enter page content here…"
          />
        </div>
      </Card>

      {/* Sections */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-text-main">Page Sections</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Dynamic content blocks for structured pages like the homepage.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addSection}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
            </Button>
          </div>

          {form.sections.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center border border-dashed border-admin-border rounded-lg">
              No sections added. Click "Add Section" to build structured page content.
            </p>
          ) : (
            <div className="space-y-3">
              {form.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-admin-border bg-admin-bg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                        Section {idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        className="px-1.5 py-0.5 text-xs text-text-muted hover:text-text-main disabled:opacity-30 transition-colors"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === form.sections.length - 1}
                        className="px-1.5 py-0.5 text-xs text-text-muted hover:text-text-main disabled:opacity-30 transition-colors"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="p-1 text-text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Type */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Section Type</label>
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(idx, "type", e.target.value)}
                        className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {SECTION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Heading / Title</label>
                      <input
                        type="text"
                        value={(section.data.heading as string) ?? ""}
                        onChange={(e) => updateSectionData(idx, "heading", e.target.value)}
                        placeholder="Section heading"
                        className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Section Body */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Content / Body</label>
                    <textarea
                      value={(section.data.body as string) ?? ""}
                      onChange={(e) => updateSectionData(idx, "body", e.target.value)}
                      placeholder="Section content or JSON data…"
                      rows={3}
                      className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Raw JSON data hint */}
                  <p className="text-xs text-text-muted">
                    Raw section data (JSON):{" "}
                    <code className="bg-admin-card rounded px-1 py-0.5 font-mono text-xs">
                      {JSON.stringify(section.data).slice(0, 80)}
                      {JSON.stringify(section.data).length > 80 ? "…" : ""}
                    </code>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Visibility */}
      <Card>
        <div className="flex items-center gap-3">
          <Toggle checked={form.isVisible} onChange={(v) => set("isVisible", v)} />
          <div>
            <p className="text-sm font-medium text-text-main">Visible</p>
            <p className="text-xs text-text-muted">Hidden pages are not accessible on the public website</p>
          </div>
        </div>
      </Card>

      {/* SEO */}
      <SeoFieldsPanel value={form.seo} onChange={(seo) => set("seo", seo)} />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/pages")}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Page"}
        </Button>
      </div>
    </form>
  );
}
