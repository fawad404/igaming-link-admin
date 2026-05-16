import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ScrapeSource } from "@/lib/models/ScrapeSource";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  crawlSchedule: z.string().optional(),
  isActive: z.boolean().optional(),
  robotsRespected: z.boolean().optional(),
  contentType: z.string().optional(),
  extractionRules: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    const { id } = await params;
    await connectDB();
    const source = await ScrapeSource.findById(id).lean();
    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ source });
  } catch (err) {
    console.error("[scraping/sources/[id] GET]", err);
    return NextResponse.json({ error: "Failed to load source" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    await connectDB();
    const source = await ScrapeSource.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ source });
  } catch (err) {
    console.error("[scraping/sources/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    const { id } = await params;
    await connectDB();
    const source = await ScrapeSource.findByIdAndDelete(id);
    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[scraping/sources/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }
}
