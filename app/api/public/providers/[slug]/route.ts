import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Provider } from "@/lib/models/Provider";
import "@/lib/models/MediaAsset";
import "@/lib/models/SeoSettings";
import "@/lib/models/Article";
import "@/lib/models/Category";
import "@/lib/models/Author";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { slug } = await params;

    const provider = await Provider.findOne({ slug, isActive: true })
      .populate("logo", "url altText")
      .populate("seoSettings")
      .populate({
        path: "relatedArticles",
        select: "title slug heroImage",
        populate: { path: "heroImage", select: "url altText" },
      })
      .lean();

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (err) {
    console.error("[public/providers/[slug] GET]", err);
    return NextResponse.json({ error: "Failed to load provider" }, { status: 500 });
  }
}
