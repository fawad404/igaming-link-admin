import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Author } from "@/lib/models/Author";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    // Any authenticated user can read authors (used as dropdown data)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const authors = await Author.find().sort({ name: 1 }).lean();
    return NextResponse.json(authors);
  } catch (err) {
    console.error("[authors GET]", err);
    return NextResponse.json({ error: "Failed to load authors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "authors:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const author = await Author.create(parsed.data);
    return NextResponse.json(author, { status: 201 });
  } catch (err) {
    console.error("[authors POST]", err);
    return NextResponse.json({ error: "Failed to create author" }, { status: 500 });
  }
}
