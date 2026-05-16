"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Settings, Globe, Search, BarChart2, Bot, Menu, ShieldCheck, Save } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Toggle } from "@/components/ui/Toggle";
import { Select } from "@/components/ui/Select";

type SettingMap = Record<string, string>;
type GroupedSettings = Record<string, { key: string; label: string; value: string }[]>;

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "seo", label: "SEO Defaults", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "ai", label: "AI", icon: Bot },
  { id: "menus", label: "Menus", icon: Menu },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [values, setValues] = useState<SettingMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error();
      const data: { settings: GroupedSettings } = await res.json();
      const flat: SettingMap = {};
      for (const group of Object.values(data.settings)) {
        for (const s of group) {
          flat[s.key] = s.value;
        }
      }
      setValues(flat);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Settings className="w-6 h-6 text-primary" />
      <div>
        <h1 className="text-xl font-semibold text-text-main">Settings</h1>
        <p className="text-sm text-text-muted">Configure global platform settings</p>
      </div>
    </div>
    {/* <Button onClick={save} disabled={saving}>
      {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
      {saving ? "Saving…" : "Save Changes"}
    </Button> */}
  </div>

  <div className="flex flex-col sm:flex-row gap-6">
    {/* Sidebar Tabs */}
    <nav className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible gap-2 sm:gap-1">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex sm:flex-row items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === id
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:text-text-main hover:bg-admin-bg"
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>

    {/* Tab Content */}
    <div className="flex-1 bg-admin-card border border-admin-border rounded-xl p-4 sm:p-6 space-y-6 overflow-x-auto">
      {activeTab === "general" && <GeneralTab values={values} set={set} />}
      {activeTab === "seo" && <SeoTab values={values} set={set} />}
      {activeTab === "analytics" && <AnalyticsTab values={values} set={set} />}
      {activeTab === "ai" && <AiTab values={values} set={set} />}
      {activeTab === "menus" && <MenusTab values={values} set={set} />}
      {activeTab === "security" && <SecurityTab values={values} set={set} />}
    </div>
  </div>
    <div className="flex justify-start lg:justify-end">
      <Button onClick={save} disabled={saving}>
      {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
      {saving ? "Saving…" : "Save Changes"}
    </Button>
    </div>
</div>
    </>
    // <div className="space-y-6">
    //   {/* Header */}
    //   <div className="flex items-center justify-between">
    //     <div className="flex items-center gap-3">
    //       <Settings className="w-6 h-6 text-primary" />
    //       <div>
    //         <h1 className="text-xl font-semibold text-text-main">Settings</h1>
    //         <p className="text-sm text-text-muted">Configure global platform settings</p>
    //       </div>
    //     </div>
    //     <Button onClick={save} disabled={saving}>
    //       {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
    //       {saving ? "Saving…" : "Save Changes"}
    //     </Button>
    //   </div>

    //   <div className="flex gap-6">
    //     {/* Sidebar Tabs */}
    //     <nav className="w-48 shrink-0 space-y-1">
    //       {TABS.map(({ id, label, icon: Icon }) => (
    //         <button
    //           key={id}
    //           onClick={() => setActiveTab(id)}
    //           className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    //             activeTab === id
    //               ? "bg-primary/10 text-primary"
    //               : "text-text-muted hover:text-text-main hover:bg-admin-bg"
    //           }`}
    //         >
    //           <Icon className="w-4 h-4 shrink-0" />
    //           {label}
    //         </button>
    //       ))}
    //     </nav>

    //     {/* Tab Content */}
    //     <div className="flex-1 bg-admin-card border border-admin-border rounded-xl p-6 space-y-6">
    //       {activeTab === "general" && (
    //         <GeneralTab values={values} set={set} />
    //       )}
    //       {activeTab === "seo" && (
    //         <SeoTab values={values} set={set} />
    //       )}
    //       {activeTab === "analytics" && (
    //         <AnalyticsTab values={values} set={set} />
    //       )}
    //       {activeTab === "ai" && (
    //         <AiTab values={values} set={set} />
    //       )}
    //       {activeTab === "menus" && (
    //         <MenusTab values={values} set={set} />
    //       )}
    //       {activeTab === "security" && (
    //         <SecurityTab values={values} set={set} />
    //       )}
    //     </div>
    //   </div>
    // </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-admin-border">
      <h2 className="text-base font-semibold text-text-main">{title}</h2>
      {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
    </div>
  );
}

function GeneralTab({ values, set }: { values: SettingMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="General Settings" description="Basic site identity and defaults" />
      <Input
        label="Site Name"
        value={values.site_name ?? ""}
        onChange={(e) => set("site_name", e.target.value)}
      />
      <Input
        label="Site URL"
        type="url"
        value={values.site_url ?? ""}
        onChange={(e) => set("site_url", e.target.value)}
        helper="The canonical URL of the public website"
      />
      <Input
        label="Contact Email"
        type="email"
        value={values.contact_email ?? ""}
        onChange={(e) => set("contact_email", e.target.value)}
      />
      <Select
        label="Default Language"
        value={values.default_language ?? "en"}
        onChange={(e) => set("default_language", e.target.value)}
        options={[
          { value: "en", label: "English" },
          { value: "es", label: "Spanish" },
          { value: "de", label: "German" },
          { value: "fr", label: "French" },
          { value: "pt", label: "Portuguese" },
        ]}
      />
    </div>
  );
}

function SeoTab({ values, set }: { values: SettingMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="SEO Defaults" description="Fallback SEO values used when entity-level fields are empty" />
      <Input
        label="Default OG Image URL"
        type="url"
        value={values.seo_default_og_image ?? ""}
        onChange={(e) => set("seo_default_og_image", e.target.value)}
        helper="Used as the Open Graph image when no entity-level OG image is set"
      />
      <Select
        label="Default Robots"
        value={values.seo_default_robots ?? "index, follow"}
        onChange={(e) => set("seo_default_robots", e.target.value)}
        options={[
          { value: "index, follow", label: "index, follow" },
          { value: "noindex, follow", label: "noindex, follow" },
          { value: "index, nofollow", label: "index, nofollow" },
          { value: "noindex, nofollow", label: "noindex, nofollow" },
        ]}
      />
      <Select
        label="Default Schema.org Type"
        value={values.seo_default_schema_org ?? "Organization"}
        onChange={(e) => set("seo_default_schema_org", e.target.value)}
        options={[
          { value: "Organization", label: "Organization" },
          { value: "WebSite", label: "WebSite" },
          { value: "Article", label: "Article" },
          { value: "NewsArticle", label: "NewsArticle" },
        ]}
      />
    </div>
  );
}

function AnalyticsTab({ values, set }: { values: SettingMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Analytics" description="Tracking and measurement integrations" />
      <Input
        label="Google Analytics ID"
        placeholder="G-XXXXXXXXXX"
        value={values.analytics_ga_id ?? ""}
        onChange={(e) => set("analytics_ga_id", e.target.value)}
        helper="GA4 Measurement ID"
      />
      <Input
        label="Google Tag Manager ID"
        placeholder="GTM-XXXXXXX"
        value={values.analytics_gtm_id ?? ""}
        onChange={(e) => set("analytics_gtm_id", e.target.value)}
      />
      <Input
        label="Search Console Verification"
        placeholder="meta name content value"
        value={values.analytics_search_console ?? ""}
        onChange={(e) => set("analytics_search_console", e.target.value)}
        helper="The content value from the Google Search Console HTML meta tag"
      />
    </div>
  );
}

function AiTab({ values, set }: { values: SettingMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="AI Settings" description="Configure the AI content generation engine" />
      <Select
        label="AI Provider"
        value={values.ai_provider ?? "openai"}
        onChange={(e) => set("ai_provider", e.target.value)}
        options={[
          { value: "openai", label: "OpenAI" },
        ]}
      />
      <Input
        label="API Key"
        type="password"
        placeholder="sk-..."
        value={values.ai_api_key ?? ""}
        onChange={(e) => set("ai_api_key", e.target.value)}
        helper="Your OpenAI or Anthropic API key — stored securely in the database, never in code"
      />
      <Select
        label="Default Model"
        value={values.ai_default_model ?? "gpt-4o"}
        onChange={(e) => set("ai_default_model", e.target.value)}
        options={[
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gpt-4o-mini", label: "GPT-4o Mini" },
          { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        ]}
      />
      <Input
        label="Token Limit Per Job"
        type="number"
        min="500"
        max="128000"
        value={values.ai_token_limit ?? "4000"}
        onChange={(e) => set("ai_token_limit", e.target.value)}
        helper="Maximum tokens generated per AI job"
      />
      <Input
        label="Daily Usage Limit (jobs)"
        type="number"
        min="1"
        value={values.ai_daily_usage_limit ?? "50"}
        onChange={(e) => set("ai_daily_usage_limit", e.target.value)}
        helper="Max number of AI generation jobs per day across all users"
      />
    </div>
  );
}

function MenusTab({ values, set }: { values: SettingMap; set: (k: string, v: string) => void }) {
  const validateJson = (val: string): string | null => {
    try {
      JSON.parse(val);
      return null;
    } catch {
      return "Invalid JSON";
    }
  };

  const headerError = values.menu_header ? validateJson(values.menu_header) : null;
  const footerError = values.menu_footer ? validateJson(values.menu_footer) : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Navigation Menus"
        description="Define header and footer navigation as JSON arrays. Each item: { label, href, children? }"
      />

      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 font-mono">
        {`[ { "label": "Home", "href": "/" }, { "label": "Providers", "href": "/providers", "children": [] } ]`}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-main mb-1">Header Menu (JSON)</label>
        <textarea
          rows={8}
          value={values.menu_header ?? "[]"}
          onChange={(e) => set("menu_header", e.target.value)}
          className={`w-full rounded-lg border bg-admin-card px-3 py-2 text-sm font-mono text-text-main placeholder:text-text-muted outline-none transition-colors resize-y ${
            headerError
              ? "border-danger focus:ring-1 focus:ring-danger"
              : "border-admin-border focus:border-primary focus:ring-1 focus:ring-primary"
          }`}
          spellCheck={false}
        />
        {headerError && <p className="text-xs text-danger mt-1">{headerError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-main mb-1">Footer Menu (JSON)</label>
        <textarea
          rows={8}
          value={values.menu_footer ?? "[]"}
          onChange={(e) => set("menu_footer", e.target.value)}
          className={`w-full rounded-lg border bg-admin-card px-3 py-2 text-sm font-mono text-text-main placeholder:text-text-muted outline-none transition-colors resize-y ${
            footerError
              ? "border-danger focus:ring-1 focus:ring-danger"
              : "border-admin-border focus:border-primary focus:ring-1 focus:ring-primary"
          }`}
          spellCheck={false}
        />
        {footerError && <p className="text-xs text-danger mt-1">{footerError}</p>}
      </div>
    </div>
  );
}

function SecurityTab({ values, set }: { values: SettingMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Security" description="Authentication and access control settings" />
      <Input
        label="Session Timeout (minutes)"
        type="number"
        min="5"
        max="10080"
        value={values.security_session_timeout ?? "60"}
        onChange={(e) => set("security_session_timeout", e.target.value)}
        helper="How long before an inactive admin session expires"
      />
      <Input
        label="Max Login Attempts"
        type="number"
        min="1"
        max="20"
        value={values.security_max_login_attempts ?? "5"}
        onChange={(e) => set("security_max_login_attempts", e.target.value)}
        helper="Lock account after this many consecutive failed logins"
      />
      <div className="flex items-center justify-between p-4 rounded-lg border border-admin-border bg-admin-bg">
        <div>
          <p className="text-sm font-medium text-text-main">Enforce 2FA for All Users</p>
          <p className="text-xs text-text-muted mt-0.5">Require two-factor authentication before any admin access</p>
        </div>
        <Toggle
          checked={values.security_2fa_enforcement === "true"}
          onChange={(v) => set("security_2fa_enforcement", String(v))}
        />
      </div>
    </div>
  );
}
