import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import { Provider } from "@/lib/models/Provider";
import { License } from "@/lib/models/License";
import "@/lib/models/Category";
import "@/lib/models/Tag";
import "@/lib/models/Author";
import "@/lib/models/MediaAsset";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();

    if (!q) {
      return NextResponse.json({ articles: [], providers: [], licenses: [] });
    }

    const regex = { $regex: q, $options: "i" };

    const [articles, providers, licenses] = await Promise.all([
      Article.find({ status: "published", title: regex })
        .limit(10)
        .populate("category", "name slug")
        .populate("heroImage", "url altText")
        .populate("author", "name avatarUrl")
        .lean(),
      Provider.find({ isActive: true, name: regex })
        .limit(10)
        .populate("logo", "url altText")
        .lean(),
      License.find({ isActive: true, name: regex })
        .limit(10)
        .lean(),
    ]);

    return NextResponse.json({ articles, providers, licenses });
  } catch (err) {
    console.error("[public/search GET]", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
