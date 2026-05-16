import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import { SeoSettings } from "@/lib/models/SeoSettings";
import { AuditLog } from "@/lib/models/AuditLog";
import "@/lib/models/Category";
import "@/lib/models/Tag";
import "@/lib/models/Author";
import { slugify } from "@/lib/utils";
import { z } from "zod";

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
  summary: z.string().optional(),
  content: z.string().optional(),
  heroImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
  status: z
    .enum([
      "imported",
      "ai-draft",
      "needs-review",
      "approved",
      "published",
      "archived",
    ])
    .default("ai-draft"),
  isFeatured: z.boolean().default(false),
  scheduledAt: z.string().optional(),
  seoSettings: SeoSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const category = searchParams.get("category") ?? "";
    const tag = searchParams.get("tag") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name")
        .populate("author", "name")
        .populate("tags", "name")
        .lean(),
      Article.countDocuments(filter),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[articles GET]", err);
    return NextResponse.json(
      { error: "Failed to load articles" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:create");
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

    const { slug: rawSlug, seoSettings: seoData, ...rest } = parsed.data;
    const slug = rawSlug || slugify(parsed.data.title);

    const article = await Article.create({
      ...rest,
      slug,
      createdBy: session?.user.id,
    });

    if (seoData && Object.keys(seoData).length > 0) {
      const seo = await SeoSettings.create({
        entityType: "Article",
        entityId: article._id,
        ...seoData,
        lastModified: new Date(),
      });
      await Article.findByIdAndUpdate(article._id, { seoSettings: seo._id });
    }

    await AuditLog.create({
      action: "created",
      entityType: "Article",
      entityId: article._id,
      entityTitle: article.title,
      performedBy: session?.user.id,
    });

    return NextResponse.json(article, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "An article with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[articles POST]", err);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 },
    );
  }
}
