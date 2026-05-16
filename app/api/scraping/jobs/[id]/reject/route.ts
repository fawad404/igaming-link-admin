import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ScrapeJob } from "@/lib/models/ScrapeJob";
import { AuditLog } from "@/lib/models/AuditLog";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    const { id } = await params;
    await connectDB();

    const job = await ScrapeJob.findById(id);
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.status !== "done") {
      return NextResponse.json(
        { error: "Only completed jobs can be rejected" },
        { status: 400 },
      );
    }

    job.status = "rejected";
    job.reviewedBy = session?.user
      .id as unknown as import("mongoose").Types.ObjectId;
    await job.save();

    await AuditLog.create({
      action: "deleted",
      entityType: "ScrapeJob",
      entityId: job._id,
      entityTitle: job.sourceUrl ?? "Scrape Job",
      performedBy: session?.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[scraping/jobs/[id]/reject PUT]", err);
    return NextResponse.json(
      { error: "Failed to reject job" },
      { status: 500 },
    );
  }
}
