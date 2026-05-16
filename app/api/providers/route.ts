import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Provider } from "@/lib/models/Provider";
import { SeoSettings } from "@/lib/models/SeoSettings";
import { AuditLog } from "@/lib/models/AuditLog";
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
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  tags: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  games: z.array(z.object({ name: z.string(), type: z.string() })).default([]),
  isActive: z.boolean().default(true),
  seo: SeoSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "providers:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const [providers, total] = await Promise.all([
      Provider.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("logo", "url altText")
        .lean(),
      Provider.countDocuments(filter),
    ]);

    return NextResponse.json({
      providers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[providers GET]", err);
    return NextResponse.json(
      { error: "Failed to load providers" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "providers:manage");
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
    const slug = rawSlug || slugify(parsed.data.name);

    const provider = await Provider.create({ ...rest, slug });

    if (seo && Object.keys(seo).length > 0) {
      const seoDoc = await SeoSettings.create({
        entityType: "Provider",
        entityId: provider._id,
        ...seo,
        lastModified: new Date(),
      });
      await Provider.findByIdAndUpdate(provider._id, {
        seoSettings: seoDoc._id,
      });
    }

    await AuditLog.create({
      action: "created",
      entityType: "Provider",
      entityId: provider._id,
      entityTitle: provider.name,
      performedBy: session?.user.id,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A provider with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[providers POST]", err);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 },
    );
  }
}
