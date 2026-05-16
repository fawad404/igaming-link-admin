"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { MediaGrid, MediaAssetItem } from "@/components/media/MediaGrid";
import { MediaUploader } from "@/components/media/MediaUploader";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetItem) => void;
  selectedId?: string;
}

export function MediaPickerModal({ open, onClose, onSelect, selectedId }: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/media?${params}`);
      const data = await res.json();
      setAssets(data.assets ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (open) fetchAssets();
  }, [open, fetchAssets]);

  function handleSelect(asset: MediaAssetItem) {
    onSelect(asset);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Media Library" size="xl">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-admin-bg p-1">
          {(["library", "upload"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-admin-card text-text-main shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              {t === "library" ? "Media Library" : "Upload New"}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <MediaUploader
            onUploaded={() => {
              setTab("library");
              setPage(1);
              fetchAssets();
            }}
          />
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by filename…"
                className="pl-9"
              />
            </div>

            <p className="text-sm text-text-muted">{total} file{total !== 1 ? "s" : ""}</p>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <MediaGrid
                assets={assets}
                selectable
                selectedId={selectedId}
                onSelect={handleSelect}
                onDeleted={(id) => setAssets((prev) => prev.filter((a) => a._id !== id))}
                onUpdated={(updated) =>
                  setAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)))
                }
              />
            )}

            {pages > 1 && (
              <Pagination page={page} totalPages={pages} onPageChange={setPage} />
            )}
          </>
        )}

        <div className="flex justify-end border-t border-admin-border pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
