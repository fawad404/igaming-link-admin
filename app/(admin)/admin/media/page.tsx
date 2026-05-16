"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { MediaGrid, MediaAssetItem } from "@/components/media/MediaGrid";
import { MediaUploader } from "@/components/media/MediaUploader";
import { Modal } from "@/components/ui/Modal";

const FOLDERS = ["All", "Articles", "Providers", "Banners", "Authors", "Pages"];

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (search) params.set("search", search);
      if (activeFolder !== "All") params.set("folder", activeFolder.toLowerCase());
      const res = await fetch(`/api/media?${params}`);
      const data = await res.json();
      setAssets(data.assets ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFolder]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFolderChange(folder: string) {
    setActiveFolder(folder);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Media Library</h1>
          <p className="mt-1 text-sm text-text-muted">
            {total} file{total !== 1 ? "s" : ""} stored on Cloudinary
          </p>
        </div>
        <Button onClick={() => setShowUploader(true)}>
          <Upload className="h-4 w-4" />
          Upload Images
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Folder tabs */}
        <div className="flex flex-wrap gap-2">
          {FOLDERS.map((folder) => (
            <button
              key={folder}
              onClick={() => handleFolderChange(folder)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFolder === folder
                  ? "bg-primary text-white"
                  : "bg-admin-card border border-admin-border text-text-muted hover:text-text-main"
              }`}
            >
              {folder !== "All" && <FolderOpen className="h-3.5 w-3.5" />}
              {folder}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by filename…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-admin-border bg-admin-card p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <MediaGrid
            assets={assets}
            onDeleted={(id) => {
              setAssets((prev) => prev.filter((a) => a._id !== id));
              setTotal((prev) => prev - 1);
            }}
            onUpdated={(updated) =>
              setAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)))
            }
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={showUploader}
        onClose={() => setShowUploader(false)}
        title="Upload Images"
        size="lg"
      >
        <MediaUploader
          onUploaded={() => {
            setShowUploader(false);
            setPage(1);
            fetchAssets();
          }}
        />
      </Modal>
    </div>
  );
}
