import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Role } from "@/lib/models/Role";
import { z } from "zod";

const UpdateSchema = z.object({
  permissions: z.array(z.string()),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "roles:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { permissions: parsed.data.permissions },
      { new: true }
    );
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    return NextResponse.json(role);
  } catch (err) {
    console.error("[roles/:id PUT]", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
