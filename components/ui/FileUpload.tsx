"use client";

import { useRef, DragEvent, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { classNames } from "@/lib/utils";

interface FileUploadProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  label?: string;
}

export function FileUpload({ onFiles, accept = "image/*", multiple = false, className, label }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={classNames(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-admin-border bg-admin-bg p-8 text-center transition-colors hover:border-primary",
        className
      )}
    >
      <Upload className="h-8 w-8 text-text-muted" />
      <div>
        <p className="text-sm font-medium text-text-main">
          {label ?? "Click or drag files here to upload"}
        </p>
        <p className="text-xs text-text-muted mt-1">{accept.replace(/\*/g, "all").replace(/,/g, ", ")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
