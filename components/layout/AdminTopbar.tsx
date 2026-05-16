"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

interface AdminTopbarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function AdminTopbar({ title, onMenuClick }: AdminTopbarProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const initials = session?.user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "AD";

  return (
    <header className="flex h-16 items-center justify-between border-b border-admin-border bg-admin-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-admin-bg hover:text-text-main transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-text-main">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg p-2 hover:bg-admin-bg transition-colors cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-text-main leading-none">{session?.user?.name}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {(session?.user as { role?: string })?.role ?? "Admin"}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-admin-border bg-admin-card shadow-lg z-10">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-admin-bg rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
