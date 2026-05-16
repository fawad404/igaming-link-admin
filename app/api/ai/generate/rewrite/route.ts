import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { checkPermission } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { getOpenAIClient } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  content: z.string().min(10, "Content is required"),
  instructions: z.string().optional(),
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

    const { content, instructions } = parsed.data;

    await connectDB();
    const job = await AIJob.create({
      type: "rewrite",
      status: "running",
      inputData: parsed.data,
      requestedBy: session?.user.id,
    });

    try {
      const { client, model } = await getOpenAIClient();

      const instructionsLine = instructions ? `\nSpecific instructions: ${instructions}` : "";

      const prompt = `Rewrite the following content to improve its quality, clarity, and SEO-friendliness for an iGaming / online casino information website.${instructionsLine}

Rules:
- Preserve the same factual information and HTML structure
- Improve readability and flow
- Make it more engaging and professional
- Do not add unsupported claims
- Return only the rewritten HTML content, no explanation

Original content:
${content}`;

      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });

      const rewritten = completion.choices[0]?.message?.content ?? "";
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      await AIJob.findByIdAndUpdate(job._id, {
        status: "done",
        outputData: { original: content, rewritten },
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
      });

      return NextResponse.json({ jobId: job._id, rewritten, tokensUsed });
    } catch (aiErr) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : "AI rewrite failed";
      await AIJob.findByIdAndUpdate(job._id, { status: "failed", error: errorMsg, completedAt: new Date() });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai/generate/rewrite POST]", err);
    return NextResponse.json({ error: "Failed to rewrite content" }, { status: 500 });
  }
}

