import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ScrapeSource } from "@/lib/models/ScrapeSource";
import { ScrapeJob } from "@/lib/models/ScrapeJob";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "scraping:manage");
    if (denied) return denied;

    const { id } = await params;
    await connectDB();

    const source = await ScrapeSource.findById(id);
    if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
    if (!source.isActive) return NextResponse.json({ error: "Source is inactive" }, { status: 400 });

    // Create a pending scrape job — actual crawling happens async or via a worker
    const job = await ScrapeJob.create({
      source: source._id,
      status: "pending",
      sourceUrl: source.url,
    });

    // Update lastCrawledAt on the source
    await ScrapeSource.findByIdAndUpdate(id, { lastCrawledAt: new Date() });

    return NextResponse.json({ jobId: job._id, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("[scraping/sources/[id]/crawl POST]", err);
    return NextResponse.json({ error: "Failed to trigger crawl" }, { status: 500 });
  }
}
