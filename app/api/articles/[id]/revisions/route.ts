import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Revision } from "@/lib/models/Revision";
import { Article } from "@/lib/models/Article";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const article = await Article.findById(id).select("_id").lean();
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const revisions = await Revision.find({ article: id })
      .sort({ createdAt: -1 })
      .populate("changedBy", "name")
      .lean();

    return NextResponse.json(revisions);
  } catch (err) {
    console.error("[articles/[id]/revisions GET]", err);
    return NextResponse.json({ error: "Failed to load revisions" }, { status: 500 });
  }
}
