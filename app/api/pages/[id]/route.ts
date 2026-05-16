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

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  sections: z.array(SectionSchema).optional(),
  isVisible: z.boolean().optional(),
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
    const denied = checkPermission(session, "pages:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const page = await Page.findById(id).populate("seoSettings").lean();
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (err) {
    console.error("[pages/:id GET]", err);
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "pages:manage");
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

    const { seo, slug: rawSlug, title, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (title) updateData.title = title;
    if (rawSlug) {
      updateData.slug = rawSlug;
    } else if (title) {
      updateData.slug = slugify(title);
    }

    const updatedPage = await Page.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).lean();

    if (!updatedPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (seo) {
      await SeoSettings.findOneAndUpdate(
        { entityType: "Page", entityId: id },
        {
          $set: {
            ...seo,
            entityType: "Page",
            entityId: id,
            lastModified: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    }

    await AuditLog.create({
      action: "updated",
      entityType: "Page",
      entityId: id,
      entityTitle: (updatedPage as { title?: string }).title ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json(updatedPage);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[pages/:id PUT]", err);
    return NextResponse.json(
      { error: "Failed to update page" },
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
    const denied = checkPermission(session, "pages:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const page = await Page.findByIdAndDelete(id).lean();
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await SeoSettings.deleteOne({ entityType: "Page", entityId: id });

    await AuditLog.create({
      action: "deleted",
      entityType: "Page",
      entityId: id,
      entityTitle: (page as { title?: string }).title ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pages/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 },
    );
  }
}
