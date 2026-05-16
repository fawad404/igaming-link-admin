import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Allow access if user can generate or approve AI content
    if (!hasPermission(session, "ai:generate") && !hasPermission(session, "ai:approve")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status") ?? "";
    const type = searchParams.get("type") ?? "";

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      AIJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requestedBy", "name email")
        .populate("approvedBy", "name email")
        .lean(),
      AIJob.countDocuments(filter),
    ]);

    return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[ai/jobs GET]", err);
    return NextResponse.json({ error: "Failed to load AI jobs" }, { status: 500 });
  }
}
