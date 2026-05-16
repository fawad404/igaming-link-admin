import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { AuditLog } from "@/lib/models/AuditLog";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().default(""),
  image: z.string().optional().nullable(),
  eventType: z.enum(["conference", "exhibition", "webinar", "networking", "awards", "other"]).default("conference"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.object({
    city: z.string().default(""),
    country: z.string().default(""),
    venue: z.string().default(""),
    isOnline: z.boolean().default(false),
  }).default({ city: "", country: "", venue: "", isOnline: false }),
  websiteUrl: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]).default("upcoming"),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const eventType = searchParams.get("eventType") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("image", "url altText originalName")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return NextResponse.json({ events, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[events GET]", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const { startDate, endDate, image, ...rest } = parsed.data;
    const existing = await Event.findOne({ slug: rest.slug });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const event = await Event.create({
      ...rest,
      image: image || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    await AuditLog.create({
      action: "created",
      entityType: "Event",
      entityId: event._id,
      entityTitle: event.title,
      performedBy: session?.user.id,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[events POST]", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
