import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { AuditLog } from "@/lib/models/AuditLog";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "users:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const user = await User.findById(id)
      .populate("role", "name permissions")
      .select("-passwordHash -twoFactorSecret")
      .lean();
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const recentActivity = await AuditLog.find({ performedBy: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ user, recentActivity });
  } catch (err) {
    console.error("[users/:id GET]", err);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "users:manage");
    if (denied) return denied;

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    )
      .populate("role", "name permissions")
      .select("-passwordHash -twoFactorSecret");
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await AuditLog.create({
      action: "updated",
      entityType: "User",
      entityId: id,
      entityTitle: user.name,
      performedBy: session?.user.id,
    });

    return NextResponse.json(user);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }
    console.error("[users/:id PUT]", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "users:manage");
    if (denied) return denied;

    const { id } = await params;
    if (id === session?.user.id) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await AuditLog.create({
      action: "deleted",
      entityType: "User",
      entityId: id,
      entityTitle: user.name,
      performedBy: session?.user.id,
    });

    return NextResponse.json({ message: "User deactivated" });
  } catch (err) {
    console.error("[users/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 },
    );
  }
}
