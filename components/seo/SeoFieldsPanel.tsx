"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

export interface SeoData {
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robots?: "index" | "noindex";
  ogTitle?: string;
  ogDescription?: string;
  focusKeywords?: string[];
  schemaType?: string;
  sitemapInclude?: boolean;
}

interface SeoFieldsPanelProps {
  value: SeoData;
  onChange: (data: SeoData) => void;
}

const ROBOTS_OPTIONS = [
  { value: "index", label: "Index (default)" },
  { value: "noindex", label: "No Index" },
];

export function SeoFieldsPanel({ value, onChange }: SeoFieldsPanelProps) {
  const [open, setOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const update = (field: keyof SeoData, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw) return;
    update("focusKeywords", [...(value.focusKeywords ?? []), kw]);
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    update("focusKeywords", (value.focusKeywords ?? []).filter((k) => k !== kw));
  };

  return (
    <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-admin-bg/50 transition-colors"
      >
        <span className="font-semibold text-text-main">SEO Settings</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {open && (
        <div className="border-t border-admin-border px-5 py-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="SEO Title"
            value={value.title ?? ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Leave empty to use page title"
          />
          <Input
            label="Canonical URL"
            value={value.canonicalUrl ?? ""}
            onChange={(e) => update("canonicalUrl", e.target.value)}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Meta Description"
              value={value.metaDescription ?? ""}
              onChange={(e) => update("metaDescription", e.target.value)}
              rows={2}
              placeholder="150–160 characters recommended"
            />
          </div>
          <Input
            label="OG Title"
            value={value.ogTitle ?? ""}
            onChange={(e) => update("ogTitle", e.target.value)}
          />
          <Select
            label="Robots"
            value={value.robots ?? "index"}
            options={ROBOTS_OPTIONS}
            onChange={(e) => update("robots", e.target.value as "index" | "noindex")}
          />
          <div className="md:col-span-2">
            <Textarea
              label="OG Description"
              value={value.ogDescription ?? ""}
              onChange={(e) => update("ogDescription", e.target.value)}
              rows={2}
            />
          </div>
          <Input
            label="Schema Type"
            value={value.schemaType ?? ""}
            onChange={(e) => update("schemaType", e.target.value)}
            placeholder="e.g. Article, NewsArticle"
          />
          <div className="flex items-center gap-3 pt-5">
            <Toggle
              checked={value.sitemapInclude ?? true}
              onChange={(checked) => update("sitemapInclude", checked)}
            />
            <span className="text-sm text-text-main">Include in sitemap</span>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-main mb-2">
              Focus Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
              {(value.focusKeywords ?? []).map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 bg-admin-bg border border-admin-border rounded-full px-2.5 py-0.5 text-xs text-text-main"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="text-text-muted hover:text-danger ml-0.5 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Add keyword and press Enter"
                className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-text-main hover:bg-admin-card transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
