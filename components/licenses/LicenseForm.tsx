"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Card } from "@/components/ui/Card";
import { SeoFieldsPanel, SeoData } from "@/components/seo/SeoFieldsPanel";
import { slugify } from "@/lib/utils";

interface FAQ {
  question: string;
  answer: string;
}

interface LicenseFormData {
  name: string;
  slug: string;
  jurisdiction: string;
  description: string;
  requirements: string;
  complianceNotes: string;
  fees: string;
  licenceTypes: string[];
  processingTime: string;
  bestFor: string;
  faqs: FAQ[];
  isActive: boolean;
  seo: SeoData;
}

interface LicenseFormProps {
  initial?: Partial<LicenseFormData> & { _id?: string };
  mode: "create" | "edit";
}

export function LicenseForm({ initial, mode }: LicenseFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<LicenseFormData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    jurisdiction: initial?.jurisdiction ?? "",
    description: initial?.description ?? "",
    requirements: initial?.requirements ?? "",
    complianceNotes: initial?.complianceNotes ?? "",
    fees: (initial as Partial<LicenseFormData>)?.fees ?? "",
    licenceTypes: (initial as Partial<LicenseFormData>)?.licenceTypes ?? [],
    processingTime: (initial as Partial<LicenseFormData>)?.processingTime ?? "",
    bestFor: (initial as Partial<LicenseFormData>)?.bestFor ?? "",
    faqs: initial?.faqs ?? [],
    isActive: initial?.isActive ?? true,
    seo: initial?.seo ?? {},
  });

  function set<K extends keyof LicenseFormData>(key: K, val: LicenseFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug || slugify(name),
    }));
  }

  function addFAQ() {
    set("faqs", [...form.faqs, { question: "", answer: "" }]);
  }

  function updateFAQ(idx: number, field: keyof FAQ, val: string) {
    const updated = form.faqs.map((faq, i) => (i === idx ? { ...faq, [field]: val } : faq));
    set("faqs", updated);
  }

  function removeFAQ(idx: number) {
    set("faqs", form.faqs.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("License name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        jurisdiction: form.jurisdiction,
        description: form.description,
        requirements: form.requirements,
        complianceNotes: form.complianceNotes,
        fees: form.fees,
        licenceTypes: form.licenceTypes,
        processingTime: form.processingTime,
        bestFor: form.bestFor,
        faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
        isActive: form.isActive,
        seo: form.seo,
      };

      const url = mode === "edit" ? `/api/licenses/${initial?._id}` : "/api/licenses";
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

      toast.success(mode === "edit" ? "License updated" : "License created");
      router.push("/admin/licenses");
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
              label="License Name *"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Malta Gaming Authority"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-generated from name"
            />
          </div>
          <Input
            label="Jurisdiction"
            value={form.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
            placeholder="e.g. Malta, UK, Gibraltar"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Brief overview of this license/jurisdiction…"
          />
        </div>
      </Card>

      {/* Requirements */}
      <Card>
        <div className="space-y-3">
          <h2 className="font-semibold text-text-main">Requirements</h2>
          <Textarea
            label=""
            value={form.requirements}
            onChange={(e) => set("requirements", e.target.value)}
            rows={6}
            placeholder="List the requirements for obtaining this license…"
          />
        </div>
      </Card>

      {/* Compliance Notes */}
      <Card>
        <div className="space-y-3">
          <h2 className="font-semibold text-text-main">Compliance Notes</h2>
          <Textarea
            label=""
            value={form.complianceNotes}
            onChange={(e) => set("complianceNotes", e.target.value)}
            rows={4}
            placeholder="Additional compliance information, restrictions, or notes…"
          />
        </div>
      </Card>

      {/* Licensing Details */}
      <Card>
        <div className="space-y-4">
          <h2 className="font-semibold text-text-main">Licensing Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Annual Fees"
              value={form.fees}
              onChange={(e) => set("fees", e.target.value)}
              placeholder="e.g. € 25,000"
            />
            <Input
              label="Processing Time"
              value={form.processingTime}
              onChange={(e) => set("processingTime", e.target.value)}
              placeholder="e.g. 4 – 8 weeks"
            />
          </div>
          <Input
            label="Best For"
            value={form.bestFor}
            onChange={(e) => set("bestFor", e.target.value)}
            placeholder="e.g. Mid-size operators, international brands"
          />
          <div>
            <p className="text-sm font-medium text-text-main mb-2">Licence Types</p>
            <div className="flex gap-3">
              {["B2C", "B2B"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.licenceTypes.includes(type)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...form.licenceTypes, type]
                        : form.licenceTypes.filter((t) => t !== type);
                      set("licenceTypes", updated);
                    }}
                    className="w-4 h-4 rounded border-admin-border accent-primary"
                  />
                  <span className="text-sm text-text-main">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* FAQs */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-main">FAQs</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addFAQ}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
            </Button>
          </div>
          {form.faqs.length === 0 ? (
            <p className="text-sm text-text-muted">No FAQs added yet. Click "Add FAQ" to start.</p>
          ) : (
            <div className="space-y-4">
              {form.faqs.map((faq, idx) => (
                <div key={idx} className="rounded-lg border border-admin-border bg-admin-bg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">FAQ {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFAQ(idx)}
                      className="p-1 text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFAQ(idx, "question", e.target.value)}
                    placeholder="Question"
                    className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(idx, "answer", e.target.value)}
                    placeholder="Answer"
                    rows={3}
                    className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  />
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
            <p className="text-xs text-text-muted">Inactive licenses are hidden from the public website</p>
          </div>
        </div>
      </Card>

      {/* SEO */}
      <SeoFieldsPanel value={form.seo} onChange={(seo) => set("seo", seo)} />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/licenses")}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create License"}
        </Button>
      </div>
    </form>
  );
}
