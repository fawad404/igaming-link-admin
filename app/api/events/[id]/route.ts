import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { AuditLog } from "@/lib/models/AuditLog";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().nullable().optional(),
  eventType: z.enum(["conference", "exhibition", "webinar", "networking", "awards", "other"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.object({
    city: z.string().default(""),
    country: z.string().default(""),
    venue: z.string().default(""),
    isOnline: z.boolean().default(false),
  }).optional(),
  websiteUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const event = await Event.findById(id).populate("image", "url altText originalName").lean();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (err) {
    console.error("[events/:id GET]", err);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const { startDate, endDate, image, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (image !== undefined) updateData.image = image || null;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    if (rest.slug) {
      const conflict = await Event.findOne({ slug: rest.slug, _id: { $ne: id } });
      if (conflict) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const event = await Event.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await AuditLog.create({
      action: "updated",
      entityType: "Event",
      entityId: id,
      entityTitle: (event as { title?: string }).title ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json(event);
  } catch (err) {
    console.error("[events/:id PUT]", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "articles:read");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const event = await Event.findByIdAndDelete(id).lean();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await AuditLog.create({
      action: "deleted",
      entityType: "Event",
      entityId: id,
      entityTitle: (event as { title?: string }).title ?? id,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[events/:id DELETE]", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
