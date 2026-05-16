import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Tag } from "@/lib/models/Tag";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
});

export async function GET() {
  try {
    // Any authenticated user can read tags (used as dropdown data)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const tags = await Tag.find().sort({ name: 1 }).lean();
    return NextResponse.json(tags);
  } catch (err) {
    console.error("[tags GET]", err);
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "tags:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const slug = parsed.data.slug || slugify(parsed.data.name);
    const tag = await Tag.create({ ...parsed.data, slug });
    return NextResponse.json(tag, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A tag with this slug already exists" }, { status: 409 });
    }
    console.error("[tags POST]", err);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
