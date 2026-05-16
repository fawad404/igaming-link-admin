import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/lib/models/Category";
import { Article } from "@/lib/models/Article";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "";

    const query: Record<string, unknown> = {};
    if (type) query.type = type;

    // Only return categories that have at least one published article
    const categoryIdsWithArticles = await Article.distinct("category", { status: "published" });
    query._id = { $in: categoryIdsWithArticles };

    const categories = await Category.find(query)
      .select("_id name slug description imageUrl type")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[public/categories GET]", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
