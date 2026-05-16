import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/lib/models/Category";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentCategory: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(["news", "blog"]).optional(),
});

export async function GET() {
  try {
    // Any authenticated user can read categories (used as dropdown data)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const categories = await Category.find()
      .sort({ name: 1 })
      .populate("parentCategory", "name")
      .lean();
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[categories GET]", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "categories:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    console.log("Body:", body)
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const slug = parsed.data.slug || slugify(parsed.data.name);
    const category = await Category.create({ ...parsed.data, slug });
    console.log("Category created:", category)
    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
    }
    console.error("[categories POST]", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
