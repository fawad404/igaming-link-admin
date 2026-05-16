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

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  logo: z.string().optional().nullable(),
  description: z.string().optional(),
  website: z.string().optional(),
  tags: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  games: z.array(z.object({ name: z.string(), type: z.string() })).optional(),
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
    const denied = checkPermission(session, "providers:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const provider = await Provider.findById(id)
      .populate("logo", "url altText _id")
      .populate("seoSettings")
      .lean();
    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(provider);
  } catch (err) {
    console.error("[providers/:id GET]", err);
    return NextResponse.json(
      { error: "Failed to load provider" },
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
    const denied = checkPermission(session, "providers:manage");
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

    const provider = await Provider.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).lean();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 },
      );
    }

    if (seo) {
      await SeoSettings.findOneAndUpdate(
        { entityType: "Provider", entityId: id },
        {
          $set: {
            ...seo,
            entityType: "Provider",
            entityId: id,
            lastModified: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    }

    await AuditLog.create({
      action: "updated",
      entityType: "Provider",
      entityId: id,
      entityTitle: (provider as { name?: string }).name ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json(provider);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A provider with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[providers/:id PUT]", err);
    return NextResponse.json(
      { error: "Failed to update provider" },
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
    const denied = checkPermission(session, "providers:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const provider = await Provider.findByIdAndDelete(id).lean();
    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 },
      );
    }

    await SeoSettings.deleteOne({ entityType: "Provider", entityId: id });

    await AuditLog.create({
      action: "deleted",
      entityType: "Provider",
      entityId: id,
      entityTitle: (provider as { name?: string }).name ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[providers/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 },
    );
  }
}
