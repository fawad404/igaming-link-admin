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

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  jurisdiction: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  complianceNotes: z.string().optional(),
  fees: z.string().optional(),
  licenceTypes: z.array(z.string()).optional(),
  processingTime: z.string().optional(),
  bestFor: z.string().optional(),
  faqs: z.array(FAQSchema).optional(),
  isActive: z.boolean().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      metaDescription: z.string().optional(),
      canonicalUrl: z.string().optional(),
      robots: z.enum(["index", "noindex"]).optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      focusKeywords: z.array(z.string()).optional(),
      schemaType: z.string().optional(),
      sitemapInclude: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "licenses:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const license = await License.findById(id).populate("seoSettings").lean();
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    return NextResponse.json(license);
  } catch (err) {
    console.error("[licenses/:id GET]", err);
    return NextResponse.json(
      { error: "Failed to load license" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "licenses:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { seo, slug: rawSlug, name, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (name) updateData.name = name;
    if (rawSlug) {
      updateData.slug = rawSlug;
    } else if (name) {
      updateData.slug = slugify(name);
    }

    const license = await License.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).lean();

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    if (seo) {
      await SeoSettings.findOneAndUpdate(
        { entityType: "License", entityId: id },
        {
          $set: {
            ...seo,
            entityType: "License",
            entityId: id,
            lastModified: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    }

    await AuditLog.create({
      action: "updated",
      entityType: "License",
      entityId: id,
      entityTitle: (license as { name?: string }).name ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json(license);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A license with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[licenses/:id PUT]", err);
    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "licenses:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const license = await License.findByIdAndDelete(id).lean();
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    await SeoSettings.deleteOne({ entityType: "License", entityId: id });

    await AuditLog.create({
      action: "deleted",
      entityType: "License",
      entityId: id,
      entityTitle: (license as { name?: string }).name ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[licenses/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete license" },
      { status: 500 },
    );
  }
}
