import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Banner } from "@/lib/models/Banner";
import { AuditLog } from "@/lib/models/AuditLog";
import { z } from "zod";

const POSITIONS = ["homepage","news","blogs","article","providers","licenses","events","casinos","partners","sidebar","navbar"] as const;

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  targetUrl: z.string().optional(),
  position: z.enum(POSITIONS).optional(),
  utmCampaign: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  geoTargets: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  { message: "End date cannot be before start date", path: ["endDate"] },
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "partners:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const banner = await Banner.findById(id)
      .populate("image", "url originalName altText")
      .lean();
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json(banner);
  } catch (err) {
    console.error("[partners/:id GET]", err);
    return NextResponse.json(
      { error: "Failed to load banner" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "partners:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { startDate, endDate, image, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (image !== undefined) updateData.image = image || null;
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;

    const banner = await Banner.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).lean();

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await AuditLog.create({
      action: "updated",
      entityType: "Banner",
      entityId: id,
      entityTitle: (banner as { name?: string }).name ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json(banner);
  } catch (err) {
    console.error("[partners/:id PUT]", err);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "partners:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const banner = await Banner.findByIdAndDelete(id).lean();
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await AuditLog.create({
      action: "deleted",
      entityType: "Banner",
      entityId: id,
      entityTitle: (banner as { name?: string }).name ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[partners/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 },
    );
  }
}
