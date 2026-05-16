import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { MediaAsset } from "@/lib/models/MediaAsset";
import { cloudinary, CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "media:read");
    if (denied) return denied;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "24"));
    const search = searchParams.get("search") ?? "";
    const folder = searchParams.get("folder") ?? "";

    const filter: Record<string, unknown> = {};
    if (search) filter.originalName = { $regex: search, $options: "i" };
    if (folder) filter.folder = folder;

    const skip = (page - 1) * limit;
    const [assets, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name")
        .lean(),
      MediaAsset.countDocuments(filter),
    ]);

    return NextResponse.json({ assets, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "media:upload");
    if (denied) return denied;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) ?? "";
    const folder = (formData.get("folder") as string) ?? "";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be under 10 MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: CLOUDINARY_FOLDER,
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
    });

    await connectDB();
    const asset = await MediaAsset.create({
      filename: uploadResult.public_id.split("/").pop() ?? uploadResult.public_id,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      folder: folder || undefined,
      altText: altText || undefined,
      uploadedBy: session?.user.id,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
