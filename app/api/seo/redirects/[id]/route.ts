import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Redirect } from "@/lib/models/Redirect";
import { z } from "zod";

const UpdateSchema = z.object({
  fromPath: z.string().min(1).optional(),
  toPath: z.string().min(1).optional(),
  type: z.union([z.literal(301), z.literal(302)]).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "seo:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const redirect = await Redirect.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!redirect) {
      return NextResponse.json({ error: "Redirect not found" }, { status: 404 });
    }

    return NextResponse.json(redirect);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A redirect from this path already exists" }, { status: 409 });
    }
    console.error("[seo/redirects/:id PUT]", err);
    return NextResponse.json({ error: "Failed to update redirect" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "seo:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const redirect = await Redirect.findByIdAndDelete(id).lean();
    if (!redirect) {
      return NextResponse.json({ error: "Redirect not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[seo/redirects/:id DELETE]", err);
    return NextResponse.json({ error: "Failed to delete redirect" }, { status: 500 });
  }
}
