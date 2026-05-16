import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ScrapeSource } from "@/lib/models/ScrapeSource";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  crawlSchedule: z.string().optional(),
  isActive: z.boolean().default(true),
  robotsRespected: z.boolean().default(true),
  contentType: z.string().optional(),
  extractionRules: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";
    const isActive = searchParams.get("isActive");

    const filter: Record<string, unknown> = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { url: { $regex: search, $options: "i" } },
    ];
    if (isActive !== null && isActive !== "") filter.isActive = isActive === "true";

    const skip = (page - 1) * limit;
    const [sources, total] = await Promise.all([
      ScrapeSource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ScrapeSource.countDocuments(filter),
    ]);

    return NextResponse.json({ sources, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[scraping/sources GET]", err);
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    await connectDB();
    const source = await ScrapeSource.create(parsed.data);
    return NextResponse.json({ source }, { status: 201 });
  } catch (err) {
    console.error("[scraping/sources POST]", err);
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}

