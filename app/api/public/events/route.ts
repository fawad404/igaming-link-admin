import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import "@/lib/models/MediaAsset";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "12"));
    const status = searchParams.get("status") ?? "";
    const featured = searchParams.get("featured") === "true";
    const trending = searchParams.get("trending") === "true";

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ["upcoming", "ongoing"] };
    }
    if (featured) filter.isFeatured = true;
    if (trending) filter.isTrending = true;

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("image", "url altText")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return NextResponse.json({ events, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[public/events GET]", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
