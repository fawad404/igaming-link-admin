import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import "@/lib/models/Category";
import "@/lib/models/Tag";
import "@/lib/models/Author";
import "@/lib/models/MediaAsset";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const category     = searchParams.get("category")     ?? "";
    const categoryType = searchParams.get("categoryType") ?? "";
    const tag          = searchParams.get("tag")          ?? "";
    const search       = searchParams.get("search")       ?? "";
    const featured     = searchParams.get("featured")     ?? "";

    const filter: Record<string, unknown> = { status: "published" };
    if (search)   filter.title      = { $regex: search, $options: "i" };
    if (featured) filter.isFeatured = featured === "true";

    if (category) {
      const { Category } = await import("@/lib/models/Category");
      const cat = await Category.findOne({ slug: category }).lean();
      if (cat) {
        filter.category = (cat as { _id: unknown })._id;
      } else {
        return NextResponse.json({ articles: [], total: 0, page, totalPages: 0 });
      }
    }

    if (categoryType) {
      const { Category } = await import("@/lib/models/Category");
      const cats = await Category.find({ type: categoryType }).select("_id").lean();
      if (cats.length > 0) {
        filter.category = { $in: cats.map((c) => (c as { _id: unknown })._id) };
      } else {
        return NextResponse.json({ articles: [], total: 0, page, totalPages: 0 });
      }
    }

    if (tag) {
      const { Tag } = await import("@/lib/models/Tag");
      const tagDoc = await Tag.findOne({ slug: tag }).lean();
      if (tagDoc) filter.tags = (tagDoc as { _id: unknown })._id;
    }

    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .populate("author", "name avatarUrl")
        .populate("heroImage", "url altText")
        .lean(),
      Article.countDocuments(filter),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[public/articles GET]", err);
    return NextResponse.json({ error: "Failed to load articles" }, { status: 500 });
  }
}
