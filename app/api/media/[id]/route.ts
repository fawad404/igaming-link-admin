import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { MediaAsset } from "@/lib/models/MediaAsset";
import { cloudinary } from "@/lib/cloudinary";
import { z } from "zod";

const UpdateSchema = z.object({
  altText: z.string().optional(),
  folder: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "media:upload");
    if (denied) return denied;

    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const asset = await MediaAsset.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "media:delete");
    if (denied) return denied;

    const { id } = await params;
    await connectDB();

    const asset = await MediaAsset.findById(id);
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await cloudinary.uploader.destroy(asset.publicId, { resource_type: "image" });
    await asset.deleteOne();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
