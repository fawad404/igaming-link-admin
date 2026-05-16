import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { checkPermission } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ScrapeJob } from "@/lib/models/ScrapeJob";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status") ?? "";
    const sourceId = searchParams.get("source") ?? "";

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (sourceId) filter.source = sourceId;

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      ScrapeJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("source", "name url")
        .populate("reviewedBy", "name email")
        .lean(),
      ScrapeJob.countDocuments(filter),
    ]);

    return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[scraping/jobs GET]", err);
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}

