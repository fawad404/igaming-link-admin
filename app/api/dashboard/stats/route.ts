import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import { Provider } from "@/lib/models/Provider";
import { License } from "@/lib/models/License";
import { MediaAsset } from "@/lib/models/MediaAsset";
import { AIJob } from "@/lib/models/AIJob";
import { AuditLog } from "@/lib/models/AuditLog";

export async function GET() {
  try {
    await connectDB();

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      reviewArticles,
      providers,
      licenses,
      mediaFiles,
      aiJobsPending,
      articlesByStatus,
      recentActivity,
    ] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ status: "published" }),
      Article.countDocuments({ status: "ai-draft" }),
      Article.countDocuments({ status: "needs-review" }),
      Provider.countDocuments({ isActive: true }),
      License.countDocuments({ isActive: true }),
      MediaAsset.countDocuments(),
      AIJob.countDocuments({ status: { $in: ["queued", "running"] } }),
      Article.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("performedBy", "name")
        .lean(),
    ]);

    const statusMap = Object.fromEntries(
      (articlesByStatus as { _id: string; count: number }[]).map((s) => [s._id, s.count])
    );

    return NextResponse.json({
      stats: {
        totalArticles,
        publishedArticles,
        draftArticles,
        reviewArticles,
        providers,
        licenses,
        mediaFiles,
        aiJobsPending,
      },
      articlesByStatus: {
        imported: statusMap["imported"] ?? 0,
        "ai-draft": statusMap["ai-draft"] ?? 0,
        "needs-review": statusMap["needs-review"] ?? 0,
        approved: statusMap["approved"] ?? 0,
        published: statusMap["published"] ?? 0,
        archived: statusMap["archived"] ?? 0,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("[dashboard/stats]", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
