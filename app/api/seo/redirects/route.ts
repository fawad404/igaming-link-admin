import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Redirect } from "@/lib/models/Redirect";
import { z } from "zod";

const CreateSchema = z.object({
  fromPath: z.string().min(1, "Source path is required"),
  toPath: z.string().min(1, "Destination path is required"),
  type: z.union([z.literal(301), z.literal(302)]).default(301),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "seo:manage");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const search = searchParams.get("search") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { fromPath: { $regex: search, $options: "i" } },
        { toPath: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [redirects, total] = await Promise.all([
      Redirect.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Redirect.countDocuments(filter),
    ]);

    return NextResponse.json({
      redirects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[seo/redirects GET]", err);
    return NextResponse.json({ error: "Failed to load redirects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "seo:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const redirect = await Redirect.create(parsed.data);
    return NextResponse.json(redirect, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A redirect from this path already exists" }, { status: 409 });
    }
    console.error("[seo/redirects POST]", err);
    return NextResponse.json({ error: "Failed to create redirect" }, { status: 500 });
  }
}
