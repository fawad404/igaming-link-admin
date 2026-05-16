import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { checkPermission } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { getOpenAIClient } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  topic: z.string().min(1, "Topic is required"),
  count: z.number().min(1).max(20).default(5),
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

    const { topic, count } = parsed.data;

    await connectDB();
    const job = await AIJob.create({
      type: "faq",
      status: "running",
      inputData: parsed.data,
      requestedBy: session?.user.id,
    });

    try {
      const { client, model } = await getOpenAIClient();

      const prompt = `Generate ${count} frequently asked questions with detailed answers about the following topic for an iGaming / online casino information website.

Topic: ${topic}

Return a valid JSON object with this structure:
{
  "faqs": [
    { "question": "Question text?", "answer": "Detailed answer." }
  ]
}

Requirements:
- Questions should be what real users search for
- Answers should be accurate, helpful, and 2-4 sentences
- Return only the JSON object, no markdown, no explanation`;

      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? '{"faqs":[]}';
      const faqData = JSON.parse(raw);
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      await AIJob.findByIdAndUpdate(job._id, {
        status: "done",
        outputData: faqData,
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
      });

      return NextResponse.json({ jobId: job._id, faqs: faqData.faqs ?? [], tokensUsed });
    } catch (aiErr) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : "AI FAQ generation failed";
      await AIJob.findByIdAndUpdate(job._id, { status: "failed", error: errorMsg, completedAt: new Date() });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai/generate/faq POST]", err);
    return NextResponse.json({ error: "Failed to generate FAQs" }, { status: 500 });
  }
}

