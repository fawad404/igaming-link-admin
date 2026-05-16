"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { classNames } from "@/lib/utils";
import toast from "react-hot-toast";

export interface MediaAssetItem {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string;
  folder?: string;
  createdAt: string;
  uploadedBy?: { name: string };
}

interface MediaGridProps {
  assets: MediaAssetItem[];
  selectable?: boolean;
  selectedId?: string;
  onSelect?: (asset: MediaAssetItem) => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (asset: MediaAssetItem) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGrid({
  assets,
  selectable = false,
  selectedId,
  onSelect,
  onDeleted,
  onUpdated,
}: MediaGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(asset: MediaAssetItem) {
    setEditingId(asset._id);
    setEditAlt(asset.altText ?? "");
  }

  async function saveAlt(id: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: editAlt }),
      });
      if (!res.ok) throw new Error();
      const { asset } = await res.json();
      onUpdated?.(asset);
      setEditingId(null);
      toast.success("Alt text saved");
    } catch {
      toast.error("Failed to save alt text");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted?.(id);
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  }

  if (!assets.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-admin-bg">
          <ImageIcon className="h-7 w-7 text-text-muted" />
        </div>
        <p className="font-medium text-text-main">No media assets found</p>
        <p className="text-sm text-text-muted">Upload images to see them here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {assets.map((asset) => {
        const isSelected = selectedId === asset._id;
        const isEditing = editingId === asset._id;

        return (
          <div
            key={asset._id}
            onClick={() => selectable && onSelect?.(asset)}
            className={classNames(
              "group relative overflow-hidden rounded-xl border bg-admin-card transition-all duration-200",
              selectable ? "cursor-pointer" : "",
              isSelected
                ? "border-primary ring-2 ring-primary/30"
                : "border-admin-border hover:border-primary/40"
            )}
          >
            {/* Thumbnail */}
            <div className="relative aspect-square overflow-hidden bg-admin-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.altText ?? asset.originalName}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Actions overlay — only in non-selectable mode */}
              {!selectable && (
                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(asset); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors"
                    title="Edit alt text"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAsset(asset._id); }}
                    disabled={deletingId === asset._id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/70 text-white hover:bg-danger transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="truncate text-xs font-medium text-text-main" title={asset.originalName}>
                {asset.originalName}
              </p>
              <p className="text-xs text-text-muted">{formatBytes(asset.size)}</p>
            </div>

            {/* Alt text editor */}
            {isEditing && (
              <div
                className="absolute inset-0 flex flex-col justify-end bg-admin-card p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="mb-1 text-xs font-medium text-text-main">Alt text</p>
                <Input
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="Describe the image"
                  className="text-xs"
                />
                <div className="mt-2 flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => saveAlt(asset._id)}
                    loading={savingId === asset._id}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
