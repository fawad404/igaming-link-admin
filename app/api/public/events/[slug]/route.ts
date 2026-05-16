import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import "@/lib/models/MediaAsset";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { slug } = await params;
    const event = await Event.findOne({ slug })
      .populate("image", "url altText")
      .lean();

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (err) {
    console.error("[public/events/:slug GET]", err);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}
