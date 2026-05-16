"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, FolderOpen, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { type MediaAssetItem } from "@/components/media/MediaGrid";
import Image from "next/image";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  type?: "news" | "blog";
  parentCategory?: { name: string } | null;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [type, setType] = useState<"news" | "blog" | "">("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setParentId("");
    setImageUrl("");
    setType("");
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!type) { toast.error("Please select a section type (News or Blog)"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          parentCategory: parentId || undefined,
          imageUrl: imageUrl || undefined,
          type: type || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }
      toast.success("Category created");
      resetForm();
      fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Category deleted");
      setDeleteId(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Categories</h1>
          <p className="text-sm text-text-muted mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-primary/30 bg-admin-card p-5 space-y-4"
        >
          <h2 className="font-semibold text-text-main">New Category</h2>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            required
          />
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Section Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "news" | "blog" | "")}
              className={`w-full rounded-lg border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
                !type ? "border-red-400" : "border-admin-border"
              }`}
              required
            >
              <option value="">— Select a type —</option>
              <option value="news">News — appears in News sections</option>
              <option value="blog">Blog — appears in Blog sections</option>
            </select>
            <p className="mt-1 text-xs text-text-muted">
              News categories feed the /news page. Blog categories feed the /blogs page. Categories with no published articles are hidden on the website.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Parent Category (optional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">None (top-level)</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-main">Category Image (optional)</label>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setMediaPickerOpen(true)}>
                  <ImageIcon className="h-3.5 w-3.5 mr-1" />
                  {imageUrl ? "Change" : "Select Image"}
                </Button>
                {imageUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            {imageUrl ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
                <Image src={imageUrl} alt="Category image" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div
                onClick={() => setMediaPickerOpen(true)}
                className="w-full h-24 rounded-lg border-2 border-dashed border-admin-border bg-admin-bg flex items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
              >
                <ImageIcon className="h-5 w-5 text-text-muted" />
                <p className="text-sm text-text-muted">Click to select a hero image</p>
              </div>
            )}
            <p className="text-xs text-text-muted">Shown as the hero background on the category page.</p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Category
            </Button>
          </div>
        </form>
      )}

      {/* Category list */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
            <FolderOpen className="h-10 w-10 opacity-40" />
            <p>No categories yet. Create your first one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Parent
                </th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat._id}
                  className="border-b border-admin-border last:border-0 hover:bg-admin-bg/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {cat.imageUrl ? (
                      <div className="w-12 h-8 rounded overflow-hidden bg-admin-bg border border-admin-border">
                        <Image src={cat.imageUrl} alt={cat.name} width={48} height={32} className="w-full h-full object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-12 h-8 rounded bg-admin-bg border border-admin-border flex items-center justify-center">
                        <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-main">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{cat.slug}</td>
                  <td className="px-4 py-3">
                    {cat.type ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        cat.type === "news"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {cat.type === "news" ? "News" : "Blog"}
                      </span>
                    ) : (
                      <span className="text-text-muted text-xs">General</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {cat.parentCategory?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 text-danger hover:bg-red-50"
                      onClick={() => setDeleteId(cat._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Deleting this category will not delete its articles, but they will no longer have a category assigned."
        confirmLabel="Delete"
        loading={deleting}
      />

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        selectedId={undefined}
        onSelect={(asset: MediaAssetItem) => {
          setImageUrl(asset.url);
          setMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
