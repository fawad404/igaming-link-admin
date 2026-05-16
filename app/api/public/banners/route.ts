import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Banner } from "@/lib/models/Banner";
import "@/lib/models/MediaAsset";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const position = searchParams.get("position");
    const now = new Date();

    const filter: Record<string, unknown> = {
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    };

    if (position) filter.position = position;

    const banners = await Banner.find(filter)
      .populate("image", "url altText")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ banners });
  } catch (err) {
    console.error("[public/banners GET]", err);
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
  }
}
