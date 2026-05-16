import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const PasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "users:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = PasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.findByIdAndUpdate(id, { passwordHash });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[users/:id/password PUT]", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
