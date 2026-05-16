import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { License } from "@/lib/models/License";
import { SeoSettings } from "@/lib/models/SeoSettings";
import { AuditLog } from "@/lib/models/AuditLog";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const FAQSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
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
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  jurisdiction: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  complianceNotes: z.string().optional(),
  fees: z.string().optional(),
  licenceTypes: z.array(z.string()).optional(),
  processingTime: z.string().optional(),
  bestFor: z.string().optional(),
  faqs: z.array(FAQSchema).default([]),
  isActive: z.boolean().default(true),
  seo: SeoSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "licenses:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const [licenses, total] = await Promise.all([
      License.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      License.countDocuments(filter),
    ]);

    return NextResponse.json({
      licenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[licenses GET]", err);
    return NextResponse.json(
      { error: "Failed to load licenses" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "licenses:manage");
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

    const license = await License.create({ ...rest, slug });

    if (seo && Object.keys(seo).length > 0) {
      const seoDoc = await SeoSettings.create({
        entityType: "License",
        entityId: license._id,
        ...seo,
        lastModified: new Date(),
      });
      await License.findByIdAndUpdate(license._id, { seoSettings: seoDoc._id });
    }

    await AuditLog.create({
      action: "created",
      entityType: "License",
      entityId: license._id,
      entityTitle: license.name,
      performedBy: session?.user.id,
    });

    return NextResponse.json(license, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A license with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[licenses POST]", err);
    return NextResponse.json(
      { error: "Failed to create license" },
      { status: 500 },
    );
  }
}
