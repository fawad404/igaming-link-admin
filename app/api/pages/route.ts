import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Page } from "@/lib/models/Page";
import { SeoSettings } from "@/lib/models/SeoSettings";
import { AuditLog } from "@/lib/models/AuditLog";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const SectionSchema = z.object({
  type: z.string().min(1),
  order: z.number().int(),
  data: z.record(z.string(), z.unknown()).default({}),
});

const SeoSchema = z.object({
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robots: z.enum(["index", "noindex"]).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  focusKeywords: z.array(z.string()).optional(),
  schemaType: z.string().optional(),
  sitemapInclude: z.boolean().optional(),
});

const CreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  content: z.string().optional(),
  sections: z.array(SectionSchema).default([]),
  isVisible: z.boolean().default(true),
  seo: SeoSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "pages:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const [pages, total] = await Promise.all([
      Page.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Page.countDocuments(filter),
    ]);

    return NextResponse.json({
      pages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[pages GET]", err);
    return NextResponse.json(
      { error: "Failed to load pages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "pages:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { slug: rawSlug, seo, ...rest } = parsed.data;
    const slug = rawSlug || slugify(parsed.data.title);

    const newPage = await Page.create({
      ...rest,
      slug,
      createdBy: session?.user.id,
    });

    if (seo && Object.keys(seo).length > 0) {
      const seoDoc = await SeoSettings.create({
        entityType: "Page",
        entityId: newPage._id,
        ...seo,
        lastModified: new Date(),
      });
      await Page.findByIdAndUpdate(newPage._id, { seoSettings: seoDoc._id });
    }

    await AuditLog.create({
      action: "created",
      entityType: "Page",
      entityId: newPage._id,
      entityTitle: newPage.title,
      performedBy: session?.user.id,
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[pages POST]", err);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 },
    );
  }
}
