"use client";

import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Users,
  Image as ImageIcon,
  Globe,
  Layers,
  Shield,
  Handshake,
  Search,
  Sparkles,
  Rss,
  UserCog,
  Settings,
  ClipboardList,
  CalendarDays,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { SidebarNavItem } from "./SidebarNavItem";
import { Logo } from "@/assets";
import Image from "next/image";

function SidebarSection({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {label}
    </p>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const perms = session?.user?.permissions ?? [];

  function can(perm: string) {
    return role === "super-admin" || perms.includes(perm);
  }

  const showContent = can("articles:read");
  const showCategories = can("categories:manage");
  const showTags = can("tags:manage");
  const showAuthors = can("authors:manage");
  const showMedia = can("media:read");
  const showPages = can("pages:manage");
  const showProviders = can("providers:manage");
  const showLicenses = can("licenses:manage");
  const showPartners = can("partners:manage");
  const showEvents = can("articles:read");
  const showSeo = can("seo:manage");
  const showAi = can("ai:generate") || can("ai:approve");
  const showScraping = can("scraping:manage");
  const showUsers = can("users:manage");
  const showRoles = can("roles:manage");
  const showSettings = can("settings:manage");
  const showLogs = can("logs:read");

  const hasContentSection = showContent || showCategories || showTags || showAuthors;
  const hasWebsiteSection = showPages || showProviders || showLicenses || showPartners || showEvents;
  const hasSeoSection = showSeo || showAi || showScraping;
  const hasSystemSection = showUsers || showRoles || showSettings || showLogs;

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <Image
          width={100}
          height={100}
          src={Logo}
          alt="iGaming Link"
          className="w-auto h-10 object-contain"
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-none">
            iGamingLink
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Admin Panel</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 hide-scrollbar">
        <SidebarSection label="Main" />
        <SidebarNavItem
          href="/admin/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
          onNavigate={onClose}
        />

        {hasContentSection && <SidebarSection label="Content" />}
        {showContent && (
          <SidebarNavItem href="/admin/articles" label="Articles" icon={FileText} onNavigate={onClose} />
        )}
        {showCategories && (
          <SidebarNavItem href="/admin/categories" label="Categories" icon={FolderOpen} onNavigate={onClose} />
        )}
        {showTags && (
          <SidebarNavItem href="/admin/tags" label="Tags" icon={Tag} onNavigate={onClose} />
        )}
        {showAuthors && (
          <SidebarNavItem href="/admin/authors" label="Authors" icon={Users} onNavigate={onClose} />
        )}

        {showMedia && <SidebarSection label="Media" />}
        {showMedia && (
          <SidebarNavItem href="/admin/media" label="Media Library" icon={ImageIcon} onNavigate={onClose} />
        )}

        {hasWebsiteSection && <SidebarSection label="Website" />}
        {showPages && (
          <SidebarNavItem href="/admin/pages" label="Pages" icon={Globe} onNavigate={onClose} />
        )}
        {showProviders && (
          <SidebarNavItem href="/admin/providers" label="Providers" icon={Layers} onNavigate={onClose} />
        )}
        {showLicenses && (
          <SidebarNavItem href="/admin/licenses" label="Licenses" icon={Shield} onNavigate={onClose} />
        )}
        {showPartners && (
          <SidebarNavItem href="/admin/partners" label="Partners & Banners" icon={Handshake} onNavigate={onClose} />
        )}
        {showEvents && (
          <SidebarNavItem href="/admin/events" label="Events" icon={CalendarDays} onNavigate={onClose} />
        )}

        {hasSeoSection && <SidebarSection label="SEO & Automation" />}
        {showSeo && (
          <SidebarNavItem href="/admin/seo" label="SEO Manager" icon={Search} onNavigate={onClose} />
        )}
        {showAi && (
          <SidebarNavItem href="/admin/ai" label="AI Content" icon={Sparkles} onNavigate={onClose} />
        )}
        {showScraping && (
          <SidebarNavItem href="/admin/scraping" label="Scraping Sources" icon={Rss} onNavigate={onClose} />
        )}

        {hasSystemSection && <SidebarSection label="System" />}
        {showUsers && (
          <SidebarNavItem href="/admin/users" label="Users" icon={UserCog} onNavigate={onClose} />
        )}
        {showRoles && (
          <SidebarNavItem href="/admin/roles" label="Roles" icon={Shield} onNavigate={onClose} />
        )}
        {showSettings && (
          <SidebarNavItem href="/admin/settings" label="Settings" icon={Settings} onNavigate={onClose} />
        )}
        {showLogs && (
          <SidebarNavItem href="/admin/logs" label="Audit Logs" icon={ClipboardList} onNavigate={onClose} />
        )}
      </nav>
    </>
  );
}

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col bg-admin-sidebar border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 flex-col bg-admin-sidebar border-r border-slate-800 shadow-xl">
            <SidebarContent onClose={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
