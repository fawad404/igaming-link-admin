"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";

interface Tag {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }
      toast.success("Tag created");
      setNewName("");
      fetchTags();
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
      const res = await fetch(`/api/tags/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Tag deleted");
      setDeleteId(null);
      fetchTags();
    } catch {
      toast.error("Failed to delete tag");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Tags</h1>
        <p className="text-sm text-text-muted mt-1">{tags.length} tags</p>
      </div>

      {/* Inline create */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <Input
          placeholder="New tag name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={submitting} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
          Add Tag
        </Button>
      </form>

      {/* Tags list */}
      <div className="rounded-xl border border-admin-border bg-admin-card p-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
            <TagIcon className="h-10 w-10 opacity-40" />
            <p>No tags yet. Add your first tag above.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag._id}
                className="flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-bg px-3 py-1.5 text-sm text-text-main"
              >
                {tag.name}
                <span className="text-xs text-text-muted font-mono">/{tag.slug}</span>
                <button
                  type="button"
                  onClick={() => setDeleteId(tag._id)}
                  className="ml-1 text-text-muted hover:text-danger transition-colors"
                  title="Delete tag"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Tag"
        message="This tag will be removed. Articles that use it will keep their other tags."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
