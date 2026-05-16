import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Author } from "@/lib/models/Author";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "authors:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const author = await Author.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!author) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(author);
  } catch (err) {
    console.error("[authors/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update author" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "authors:manage");
    if (denied) return denied;

    await connectDB();
    const author = await Author.findByIdAndDelete(id);
    if (!author) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[authors/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete author" }, { status: 500 });
  }
}
