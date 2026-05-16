import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import "@/lib/models/Category";
import "@/lib/models/Tag";
import "@/lib/models/Author";
import "@/lib/models/MediaAsset";
import "@/lib/models/SeoSettings";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { slug } = await params;

    const article = await Article.findOne({ slug, status: "published" })
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .populate("author", "name avatarUrl")
      .populate("heroImage", "url altText")
      .populate("seoSettings")
      .lean();

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (err) {
    console.error("[public/articles/[slug] GET]", err);
    return NextResponse.json({ error: "Failed to load article" }, { status: 500 });
  }
}
