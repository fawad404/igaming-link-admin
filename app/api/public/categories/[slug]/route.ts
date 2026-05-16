import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/lib/models/Category";
import { Article } from "@/lib/models/Article";
import "@/lib/models/Tag";
import "@/lib/models/Author";
import "@/lib/models/MediaAsset";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const cat = category as { _id: unknown; name: string; slug: string; description?: string; imageUrl?: string };
    const filter = { category: cat._id, status: "published" };
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("tags", "name slug")
        .populate("author", "name avatarUrl")
        .populate("heroImage", "url altText")
        .lean(),
      Article.countDocuments(filter),
    ]);

    return NextResponse.json({
      category: { _id: cat._id, name: cat.name, slug: cat.slug, description: cat.description, imageUrl: cat.imageUrl },
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[public/categories/[slug] GET]", err);
    return NextResponse.json({ error: "Failed to load category" }, { status: 500 });
  }
}
