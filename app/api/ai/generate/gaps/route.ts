import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { checkPermission } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { Article } from "@/lib/models/Article";
import { getOpenAIClient } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  niche: z.string().min(1, "Niche/topic is required"),
  existingTopics: z.array(z.string()).default([]),
  count: z.number().min(3).max(20).default(10),
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

    const { niche, existingTopics, count } = parsed.data;

    await connectDB();

    // Pull recent published article titles to help detect real gaps
    const recentArticles = await Article.find({ status: "published" })
      .sort({ publishedAt: -1 })
      .limit(30)
      .select("title")
      .lean();
    const recentTitles = recentArticles.map((a) => a.title);
    const allExisting = [...existingTopics, ...recentTitles];

    const job = await AIJob.create({
      type: "gaps",
      status: "running",
      inputData: { niche, existingTopics: allExisting.slice(0, 30), count },
      requestedBy: session?.user.id,
    });

    try {
      const { client, model } = await getOpenAIClient();

      const existingBlock = allExisting.length
        ? `\nExisting content already published (do NOT suggest these topics):\n${allExisting.slice(0, 30).map((t) => `- ${t}`).join("\n")}`
        : "";

      const prompt = `You are an SEO content strategist for an iGaming / online casino news and information website.

Niche / focus area: ${niche}${existingBlock}

Generate ${count} content gap topic ideas that:
- Are NOT already covered by the existing content above
- Have clear search intent (informational, navigational, or commercial investigation)
- Are relevant to iGaming, online casinos, gambling regulations, providers, or related topics
- Have realistic search volume potential
- Would be valuable to a global iGaming audience

For each topic, provide:
1. Title: A specific, clickable article title
2. Type: article type (News, Guide, Review, Comparison, FAQ, Listicle)
3. Intent: user search intent
4. Keywords: 2-3 target keywords

Return the result as a JSON array:
[
  {
    "title": "...",
    "type": "...",
    "intent": "...",
    "keywords": ["...", "..."]
  }
]

Return only the JSON array, no explanation.`;

      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      let suggestions: unknown[] = [];
      try {
        const parsed = JSON.parse(raw);
        suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions ?? parsed.topics ?? []);
      } catch {
        suggestions = [];
      }

      await AIJob.findByIdAndUpdate(job._id, {
        status: "done",
        outputData: { suggestions },
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
      });

      return NextResponse.json({ jobId: job._id, suggestions, tokensUsed });
    } catch (aiErr) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : "AI generation failed";
      await AIJob.findByIdAndUpdate(job._id, { status: "failed", error: errorMsg, completedAt: new Date() });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai/generate/gaps POST]", err);
    return NextResponse.json({ error: "Failed to generate content gaps" }, { status: 500 });
  }
}

