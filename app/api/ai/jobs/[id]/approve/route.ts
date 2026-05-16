import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { AuditLog } from "@/lib/models/AuditLog";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "ai:approve");
    if (denied) return denied;

    const { id } = await params;
    await connectDB();

    const job = await AIJob.findById(id);
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.status !== "done") {
      return NextResponse.json(
        { error: "Only completed jobs can be approved" },
        { status: 400 },
      );
    }

    await AIJob.findByIdAndUpdate(id, {
      status: "approved",
      approvedBy: session?.user.id,
    });

    await AuditLog.create({
      action: "approved",
      entityType: "AIJob",
      entityId: job._id,
      entityTitle: `AI ${job.type} job`,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ai/jobs/approve PUT]", err);
    return NextResponse.json(
      { error: "Failed to approve job" },
      { status: 500 },
    );
  }
}
