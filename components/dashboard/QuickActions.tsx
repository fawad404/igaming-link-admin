"use client";

import Link from "next/link";
import { FilePlus, Upload, Sparkles } from "lucide-react";

const actions = [
  {
    label: "New Article",
    description: "Start writing a new blog post or news article",
    href: "/admin/articles/new",
    icon: FilePlus,
    color: "text-primary bg-primary/10 hover:bg-primary/20",
  },
  {
    label: "Upload Media",
    description: "Add images or files to the media library",
    href: "/admin/media",
    icon: Upload,
    color: "text-info bg-info/10 hover:bg-info/20",
  },
  {
    label: "Generate AI Draft",
    description: "Use AI to generate a content draft",
    href: "/admin/ai",
    icon: Sparkles,
    color: "text-state-approved bg-state-approved/10 hover:bg-state-approved/20",
  },
];

export function QuickActions() {
  return (
    <div className="space-y-3">
      {actions.map(({ label, description, href, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-4 rounded-lg border border-admin-border bg-admin-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${color}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">{label}</p>
            <p className="text-xs text-text-muted">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
