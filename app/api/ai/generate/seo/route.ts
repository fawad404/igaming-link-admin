import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { checkPermission } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { getOpenAIClient } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content summary is required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "ai:generate");
    if (denied) return denied;

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const { title, content } = parsed.data;

    await connectDB();
    const job = await AIJob.create({
      type: "seo",
      status: "running",
      inputData: parsed.data,
      requestedBy: session?.user.id,
    });

    try {
      const { client, model } = await getOpenAIClient();

      const prompt = `Generate SEO metadata for the following iGaming / online casino article.

Title: ${title}
Content summary: ${content}

Return a valid JSON object with exactly these fields:
{
  "seoTitle": "60-char max SEO title",
  "metaDescription": "150-160 char meta description",
  "slug": "url-friendly-slug",
  "ogTitle": "Open Graph title (can match seoTitle)",
  "ogDescription": "OG description (can match metaDescription)",
  "focusKeywords": ["keyword1", "keyword2", "keyword3"]
}

Return only the JSON object, no markdown, no explanation.`;

      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const seoData = JSON.parse(raw);
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      await AIJob.findByIdAndUpdate(job._id, {
        status: "done",
        outputData: seoData,
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
      });

      return NextResponse.json({ jobId: job._id, ...seoData, tokensUsed });
    } catch (aiErr) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : "AI SEO generation failed";
      await AIJob.findByIdAndUpdate(job._id, { status: "failed", error: errorMsg, completedAt: new Date() });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai/generate/seo POST]", err);
    return NextResponse.json({ error: "Failed to generate SEO metadata" }, { status: 500 });
  }
}

