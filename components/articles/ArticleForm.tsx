"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { SeoFieldsPanel, type SeoData } from "@/components/seo/SeoFieldsPanel";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { type MediaAssetItem } from "@/components/media/MediaGrid";
import { slugify } from "@/lib/utils";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";

interface CategoryOption {
  _id: string;
  name: string;
}

interface TagOption {
  _id: string;
  name: string;
}

interface AuthorOption {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface ArticleFormData {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  heroImage?: { _id: string; url: string; altText?: string } | string | null;
  category?: { _id: string; name: string } | string | null;
  tags?: { _id: string; name: string }[];
  author?: { _id: string; name: string } | string | null;
  status?: string;
  isFeatured?: boolean;
  scheduledAt?: string | null;
}

interface ArticleFormProps {
  articleId?: string;
  initialData?: ArticleFormData;
  initialSeo?: SeoData;
}

const STATUS_OPTIONS = [
  { value: "imported", label: "Imported" },
  { value: "ai-draft", label: "AI Draft" },
  { value: "needs-review", label: "Needs Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function getCategoryId(cat: ArticleFormData["category"]): string {
  if (!cat) return "";
  if (typeof cat === "string") return cat;
  return cat._id;
}

function getAuthorId(author: ArticleFormData["author"]): string {
  if (!author) return "";
  if (typeof author === "string") return author;
  return author._id;
}

export function ArticleForm({ articleId, initialData, initialSeo }: ArticleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [categoryId, setCategoryId] = useState(getCategoryId(initialData?.category));
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    (initialData?.tags ?? []).map((t) =>
      typeof t === "string" ? { _id: t, name: "" } : t
    )
  );
  const [authorId, setAuthorId] = useState(getAuthorId(initialData?.author));
  const [status, setStatus] = useState(initialData?.status ?? "ai-draft");
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduledAt ? initialData.scheduledAt.slice(0, 16) : ""
  );
  const [seoData, setSeoData] = useState<SeoData>(initialSeo ?? {});
  const [heroImage, setHeroImage] = useState<{ _id: string; url: string; altText?: string } | null>(() => {
    const h = initialData?.heroImage;
    if (!h) return null;
    if (typeof h === "string") return null;
    return h as { _id: string; url: string; altText?: string };
  });
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/authors").then((r) => r.json()),
    ]).then(([cats, tags, auths]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setAllTags(Array.isArray(tags) ? tags : []);
      setAuthors(Array.isArray(auths) ? auths : []);
    });
  }, []);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const toggleTag = (tag: TagOption) => {
    setSelectedTags((prev) =>
      prev.some((t) => t._id === tag._id)
        ? prev.filter((t) => t._id !== tag._id)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        summary: summary || undefined,
        content,
        heroImage: heroImage?._id ?? null,
        category: categoryId || undefined,
        tags: selectedTags.map((t) => t._id),
        author: authorId || undefined,
        status,
        isFeatured,
        scheduledAt: scheduledAt || undefined,
        seoSettings: Object.keys(seoData).length > 0 ? seoData : undefined,
      };

      const url = articleId ? `/api/articles/${articleId}` : "/api/articles";
      const method = articleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      toast.success(articleId ? "Article updated" : "Article created");
      router.push("/admin/articles");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core fields */}
      <div className="rounded-xl border border-admin-border bg-admin-card p-5 space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          required
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManual(true);
          }}
          placeholder="article-slug"
          helper="Auto-generated from title. Edit to override."
        />
        <Textarea
          label="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          placeholder="Short excerpt shown in article cards"
        />
      </div>

      {/* Hero Image */}
      <div className="rounded-xl border border-admin-border bg-admin-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-main">Hero Image</label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setMediaPickerOpen(true)}>
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              {heroImage ? "Change Image" : "Select Image"}
            </Button>
            {heroImage && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setHeroImage(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {heroImage ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
            <Image
              src={heroImage.url}
              alt={heroImage.altText ?? "Hero image"}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div
            onClick={() => setMediaPickerOpen(true)}
            className="w-full h-32 rounded-lg border-2 border-dashed border-admin-border bg-admin-bg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
          >
            <ImageIcon className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-muted">Click to select a hero image from the Media Library</p>
          </div>
        )}
        <p className="text-xs text-text-muted">
          This image appears as the background on article cards and the welcome hero section.
        </p>
      </div>

      {/* Content editor */}
      <div className="rounded-xl border border-admin-border bg-admin-card p-5">
        <label className="block text-sm font-medium text-text-main mb-2">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={22}
          placeholder="Write article content here — HTML is supported"
          className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-text-main font-mono leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
        />
        <p className="mt-1.5 text-xs text-text-muted">
          HTML supported. Swap this textarea for TinyMCE or another rich-text editor by replacing this field.
        </p>
      </div>

      {/* Metadata */}
      <div className="rounded-xl border border-admin-border bg-admin-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={categoryId}
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
          placeholder="Select category"
          onChange={(e) => setCategoryId(e.target.value)}
        />
        <Select
          label="Author"
          value={authorId}
          options={authors
            .filter((a) => a.isActive)
            .map((a) => ({ value: a._id, label: a.name }))}
          placeholder="Select author"
          onChange={(e) => setAuthorId(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Input
          label="Scheduled Publish Date"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />

        {/* Tags */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-main mb-2">Tags</label>
          {allTags.length === 0 ? (
            <p className="text-sm text-text-muted">
              No tags yet.{" "}
              <a href="/admin/tags" className="text-primary hover:underline">
                Create tags
              </a>{" "}
              first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const selected = selectedTags.some((t) => t._id === tag._id);
                return (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-admin-bg text-text-muted border-admin-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Featured toggle */}
        <div className="flex items-center gap-3">
          <Toggle checked={isFeatured} onChange={setIsFeatured} />
          <span className="text-sm text-text-main">Featured article</span>
        </div>
      </div>

      {/* SEO */}
      <SeoFieldsPanel value={seoData} onChange={setSeoData} />

      {/* Form actions */}
      <div className="flex items-center justify-between pb-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/articles")}
        >
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {articleId ? "Save Changes" : "Create Article"}
        </Button>
      </div>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        selectedId={heroImage?._id}
        onSelect={(asset: MediaAssetItem) => {
          setHeroImage({ _id: asset._id, url: asset.url, altText: asset.altText });
          setMediaPickerOpen(false);
        }}
      />
    </form>
  );
}
