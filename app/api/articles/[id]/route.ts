import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import { Revision } from "@/lib/models/Revision";
import { SeoSettings } from "@/lib/models/SeoSettings";
import { AuditLog } from "@/lib/models/AuditLog";
import "@/lib/models/Category";
import "@/lib/models/Tag";
import "@/lib/models/Author";
import "@/lib/models/MediaAsset";
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

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  heroImage: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().nullable().optional(),
  status: z
    .enum([
      "imported",
      "ai-draft",
      "needs-review",
      "approved",
      "published",
      "archived",
    ])
    .optional(),
  isFeatured: z.boolean().optional(),
  scheduledAt: z.string().nullable().optional(),
  changeNote: z.string().optional(),
  seoSettings: SeoSchema.optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const article = await Article.findById(id)
      .populate("category", "name slug")
      .populate("author", "name avatarUrl")
      .populate("tags", "name slug")
      .populate("heroImage", "url altText filename")
      .populate("seoSettings")
      .lean();
    if (!article)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch (err) {
    console.error("[articles/[id] GET]", err);
    return NextResponse.json(
      { error: "Failed to load article" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:edit");
    if (denied) return denied;

    await connectDB();
    const existing = await Article.findById(id);
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { changeNote, seoSettings: seoData, ...updateData } = parsed.data;

    if (
      updateData.content !== undefined &&
      updateData.content !== existing.content
    ) {
      const revision = await Revision.create({
        article: id,
        content: existing.content,
        changedBy: session?.user.id,
        changeNote: changeNote ?? "Content updated",
      });
      existing.revisions.push(revision._id);
      await existing.save();
    }

    const updates: Record<string, unknown> = {
      ...updateData,
      updatedBy: session?.user.id,
    };
    if (updateData.status === "published" && existing.status !== "published") {
      updates.publishedAt = new Date();
    }

    if (seoData && Object.keys(seoData).length > 0) {
      if (existing.seoSettings) {
        await SeoSettings.findByIdAndUpdate(existing.seoSettings, {
          ...seoData,
          lastModified: new Date(),
        });
      } else {
        const seo = await SeoSettings.create({
          entityType: "Article",
          entityId: id,
          ...seoData,
          lastModified: new Date(),
        });
        updates.seoSettings = seo._id;
      }
    }

    const updated = await Article.findByIdAndUpdate(id, updates, { new: true })
      .populate("category", "name")
      .populate("author", "name")
      .populate("tags", "name");

    await AuditLog.create({
      action: "updated",
      entityType: "Article",
      entityId: id,
      entityTitle: updated?.title,
      performedBy: session?.user.id,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[articles/[id] PUT]", err);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:delete");
    if (denied) return denied;

    await connectDB();
    const article = await Article.findByIdAndUpdate(
      id,
      { status: "archived", updatedBy: session?.user.id },
      { new: true },
    );
    if (!article)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await AuditLog.create({
      action: "deleted",
      entityType: "Article",
      entityId: id,
      entityTitle: article.title,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[articles/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Failed to archive article" },
      { status: 500 },
    );
  }
}
