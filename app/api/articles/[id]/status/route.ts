import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import { AuditLog } from "@/lib/models/AuditLog";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum([
    "imported",
    "ai-draft",
    "needs-review",
    "approved",
    "published",
    "archived",
  ]),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    // Publishing requires articles:publish; other status changes require articles:edit
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const requiredPerm =
      parsed.data.status === "published" ? "articles:publish" : "articles:edit";
    const denied = checkPermission(session, requiredPerm);
    if (denied) return denied;

    await connectDB();

    const updates: Record<string, unknown> = {
      status: parsed.data.status,
      updatedBy: session?.user.id,
    };

    if (parsed.data.status === "published") {
      const existing = await Article.findById(id).select("publishedAt").lean();
      if (existing && !existing.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const article = await Article.findByIdAndUpdate(id, updates, { new: true });
    if (!article)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await AuditLog.create({
      action: "published",
      entityType: "Article",
      entityId: id,
      entityTitle: article.title,
      performedBy: session?.user.id,
      metadata: { status: parsed.data.status },
    });

    return NextResponse.json(article);
  } catch (err) {
    console.error("[articles/[id]/status PUT]", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
