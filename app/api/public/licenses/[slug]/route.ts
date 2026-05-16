import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { License } from "@/lib/models/License";
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

    const license = await License.findOne({ slug, isActive: true })
      .populate("seoSettings")
      .lean();

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (err) {
    console.error("[public/licenses/[slug] GET]", err);
    return NextResponse.json({ error: "Failed to load license" }, { status: 500 });
  }
}
