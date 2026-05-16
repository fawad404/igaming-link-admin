"use client";

import { useRef, useState, DragEvent } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { classNames } from "@/lib/utils";
import toast from "react-hot-toast";

const FOLDER_OPTIONS = [
  { value: "", label: "No folder (uncategorized)" },
  { value: "articles", label: "Articles" },
  { value: "providers", label: "Providers" },
  { value: "banners", label: "Banners" },
  { value: "authors", label: "Authors" },
  { value: "pages", label: "Pages" },
];

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  done: boolean;
  error?: string;
}

interface MediaUploaderProps {
  onUploaded: () => void;
}

export function MediaUploader({ onUploaded }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("");

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(incoming)) {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: unsupported type`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: exceeds 10 MB limit`);
        continue;
      }
      newFiles.push({ file, preview: URL.createObjectURL(file), progress: 0, done: false });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadAll() {
    if (!files.length) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.done) continue;

      const fd = new FormData();
      fd.append("file", item.file);
      if (folder) fd.append("folder", folder);

      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, progress: 30 } : f))
      );

      try {
        const res = await fetch("/api/media", { method: "POST", body: fd });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? "Upload failed");
        }
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 100, done: true } : f))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, error: msg } : f))
        );
        toast.error(`${item.file.name}: ${msg}`);
      }
    }

    setUploading(false);
    const anyDone = files.some((f) => f.done);
    if (anyDone) {
      onUploaded();
      toast.success("Files uploaded successfully");
    }
  }

  const pendingCount = files.filter((f) => !f.done && !f.error).length;

  return (
    <div className="space-y-4">
      <Select
        label="Upload to folder"
        options={FOLDER_OPTIONS}
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={classNames(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-admin-border hover:border-primary/50 hover:bg-admin-bg"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-admin-bg">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium text-text-main">Drop images here or click to browse</p>
          <p className="mt-1 text-sm text-text-muted">JPEG, PNG, GIF, WebP, SVG — max 10 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-admin-border bg-admin-card p-3"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-admin-bg">
                {item.file.type !== "image/svg+xml" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-text-muted" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-main">{item.file.name}</p>
                <p className="text-xs text-text-muted">
                  {(item.file.size / 1024).toFixed(0)} KB
                </p>
                {item.error && <p className="text-xs text-danger">{item.error}</p>}
                {!item.error && item.progress > 0 && !item.done && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-admin-bg">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.done && <p className="text-xs text-success">Uploaded</p>}
              </div>

              {!item.done && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="flex-shrink-0 text-text-muted hover:text-danger transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {pendingCount > 0 && (
            <div className="flex justify-end pt-2">
              <Button onClick={uploadAll} loading={uploading} disabled={uploading}>
                Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
