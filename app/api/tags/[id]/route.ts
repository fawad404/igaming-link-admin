import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Tag } from "@/lib/models/Tag";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "tags:manage");
    if (denied) return denied;

    await connectDB();
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[tags/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
