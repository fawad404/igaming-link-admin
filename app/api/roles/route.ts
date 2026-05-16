import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Role } from "@/lib/models/Role";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.enum(["super-admin", "editor", "seo-manager", "reviewer", "developer", "viewer"]),
  permissions: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "roles:manage");
    if (denied) return denied;

    await connectDB();
    const roles = await Role.find().sort({ name: 1 }).lean();
    return NextResponse.json({ roles });
  } catch (err) {
    console.error("[roles GET]", err);
    return NextResponse.json({ error: "Failed to load roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "roles:manage");
    if (denied) return denied;

    await connectDB();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const role = await Role.create(parsed.data);
    return NextResponse.json(role, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Role already exists" }, { status: 409 });
    }
    console.error("[roles POST]", err);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
