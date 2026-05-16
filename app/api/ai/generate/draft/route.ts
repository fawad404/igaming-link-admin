import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { getOpenAIClient } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  topic: z.string().min(1, "Topic is required"),
  keywords: z.array(z.string()).default([]),
  outline: z.string().optional(),
  targetLength: z.number().min(100).max(5000).default(800),
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

    const { topic, keywords, outline, targetLength } = parsed.data;

    await connectDB();
    const job = await AIJob.create({
      type: "draft",
      status: "running",
      inputData: parsed.data,
      requestedBy: session?.user.id,
    });

    try {
      const { client, model } = await getOpenAIClient();

      const keywordLine = keywords.length ? `\nTarget keywords: ${keywords.join(", ")}` : "";
      const outlineLine = outline ? `\nOutline to follow:\n${outline}` : "";

      const prompt = `Write a high-quality, SEO-optimized article about the following topic for an iGaming / online casino information website.

Topic: ${topic}${keywordLine}${outlineLine}

Requirements:
- Length: approximately ${targetLength} words
- Use proper HTML headings (h2, h3)
- Include an introduction and conclusion
- Write in a professional, informative tone
- Do not use markdown — output clean HTML suitable for a rich text editor
- Focus on accuracy and value for readers interested in online gambling

Return only the HTML article content, no explanation.`;

      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });

      const content = completion.choices[0]?.message?.content ?? "";
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      await AIJob.findByIdAndUpdate(job._id, {
        status: "done",
        outputData: { content },
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
      });

      return NextResponse.json({ jobId: job._id, content, tokensUsed });
    } catch (aiErr) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : "AI generation failed";
      await AIJob.findByIdAndUpdate(job._id, { status: "failed", error: errorMsg, completedAt: new Date() });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai/generate/draft POST]", err);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
