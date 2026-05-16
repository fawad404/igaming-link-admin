import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiKey } from "@/lib/publicApiAuth";
import { connectDB } from "@/lib/mongodb";
import { License } from "@/lib/models/License";

export async function GET(req: NextRequest) {
  const denied = checkPublicApiKey(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

    const filter = { isActive: true };
    const skip = (page - 1) * limit;

    const [licenses, total] = await Promise.all([
      License.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      License.countDocuments(filter),
    ]);

    return NextResponse.json({
      licenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[public/licenses GET]", err);
    return NextResponse.json({ error: "Failed to load licenses" }, { status: 500 });
  }
}
