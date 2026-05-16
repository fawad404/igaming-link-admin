import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import "@/lib/models/Category";
import "@/lib/models/Author";
import "@/lib/models/MediaAsset";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();

    const articles = await Article.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("heroImage", "url altText")
      .populate("category", "name slug")
      .populate("author", "name avatarUrl")
      .lean();

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[public/trending GET]", err);
    return NextResponse.json({ error: "Failed to load trending" }, { status: 500 });
  }
}
