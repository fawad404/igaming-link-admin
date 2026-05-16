"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { classNames } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, helper, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-main">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={classNames(
            "w-full rounded-lg border bg-admin-card px-3 py-2 text-sm text-text-main placeholder:text-text-muted outline-none transition-colors resize-y",
            error
              ? "border-danger focus:ring-1 focus:ring-danger"
              : "border-admin-border focus:border-primary focus:ring-1 focus:ring-primary",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helper && <p className="text-xs text-text-muted">{helper}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
