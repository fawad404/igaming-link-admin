import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Banner } from "@/lib/models/Banner";
import { AuditLog } from "@/lib/models/AuditLog";
import { z } from "zod";

const POSITIONS = ["homepage","news","blogs","article","providers","licenses","events","casinos","partners","sidebar","navbar"] as const;

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().optional(),
  targetUrl: z.string().min(1, "Target URL is required"),
  position: z.enum(POSITIONS).default("sidebar"),
  utmCampaign: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  geoTargets: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  { message: "End date cannot be before start date", path: ["endDate"] },
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "partners:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .populate("image", "url originalName altText")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Banner.countDocuments(filter),
    ]);

    return NextResponse.json({
      banners,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[partners GET]", err);
    return NextResponse.json(
      { error: "Failed to load partners" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "partners:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { startDate, endDate, ...rest } = parsed.data;
    const bannerData: Record<string, unknown> = { ...rest };
    if (startDate) bannerData.startDate = new Date(startDate);
    if (endDate) bannerData.endDate = new Date(endDate);

    const banner = await Banner.create(bannerData);

    await AuditLog.create({
      action: "created",
      entityType: "Banner",
      entityId: banner._id,
      entityTitle: banner.name,
      performedBy: session?.user.id,
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (err) {
    console.error("[partners POST]", err);
    return NextResponse.json(
      { error: "Failed to create partner banner" },
      { status: 500 },
    );
  }
}
