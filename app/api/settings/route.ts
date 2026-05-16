import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Setting } from "@/lib/models/Setting";
import { z } from "zod";

const DEFAULT_SETTINGS = [
  // General
  { key: "site_name", label: "Site Name", group: "general", value: "iGaming Link" },
  { key: "site_url", label: "Site URL", group: "general", value: "https://igaminglink.com" },
  { key: "contact_email", label: "Contact Email", group: "general", value: "" },
  { key: "default_language", label: "Default Language", group: "general", value: "en" },
  // SEO
  { key: "seo_default_og_image", label: "Default OG Image URL", group: "seo", value: "" },
  { key: "seo_default_robots", label: "Default Robots", group: "seo", value: "index, follow" },
  { key: "seo_default_schema_org", label: "Default Schema.org Type", group: "seo", value: "Organization" },
  // Analytics
  { key: "analytics_ga_id", label: "Google Analytics ID", group: "analytics", value: "" },
  { key: "analytics_gtm_id", label: "Google Tag Manager ID", group: "analytics", value: "" },
  { key: "analytics_search_console", label: "Search Console Verification", group: "analytics", value: "" },
  // AI
  { key: "ai_provider", label: "AI Provider", group: "ai", value: "openai" },
  { key: "ai_default_model", label: "Default Model", group: "ai", value: "gpt-4o" },
  { key: "ai_token_limit", label: "Token Limit Per Job", group: "ai", value: "4000" },
  { key: "ai_daily_usage_limit", label: "Daily Usage Limit (jobs)", group: "ai", value: "50" },
  // Menus
  { key: "menu_header", label: "Header Menu (JSON)", group: "menus", value: "[]" },
  { key: "menu_footer", label: "Footer Menu (JSON)", group: "menus", value: "[]" },
  // Security
  { key: "security_session_timeout", label: "Session Timeout (minutes)", group: "security", value: "60" },
  { key: "security_max_login_attempts", label: "Max Login Attempts", group: "security", value: "5" },
  { key: "security_2fa_enforcement", label: "Enforce 2FA for All Users", group: "security", value: "false" },
] as const;

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "settings:manage");
    if (denied) return denied;

    await connectDB();

    // Seed missing defaults
    for (const def of DEFAULT_SETTINGS) {
      await Setting.findOneAndUpdate(
        { key: def.key },
        { $setOnInsert: { key: def.key, label: def.label, group: def.group, value: def.value } },
        { upsert: true, new: true }
      );
    }

    const all = await Setting.find().lean();
    const grouped: Record<string, { key: string; label: string; value: string }[]> = {};
    for (const s of all) {
      if (!grouped[s.group]) grouped[s.group] = [];
      grouped[s.group].push({ key: s.key, label: s.label, value: s.value });
    }

    return NextResponse.json({ settings: grouped });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

const BulkUpdateSchema = z.record(z.string(), z.string());

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "settings:manage");
    if (denied) return denied;

    const body = await req.json();
    const parsed = BulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    await connectDB();

    const updates = Object.entries(parsed.data).map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
    );
    await Promise.all(updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
