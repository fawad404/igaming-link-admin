import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { checkPermission } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AIJob } from "@/lib/models/AIJob";
import { getOpenAIClient } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  schemaType: z.enum(["Article", "FAQPage", "BreadcrumbList", "Organization", "WebSite"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url().optional(),
  extra: z.string().optional(),
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

    const { schemaType, title, description, url, extra } = parsed.data;

    await connectDB();
    const job = await AIJob.create({
      type: "schema",
      status: "running",
      inputData: parsed.data,
      requestedBy: session?.user.id,
    });

    try {
      const { client, model } = await getOpenAIClient();

      const prompt = `Generate a valid JSON-LD structured data block for the following content.

Schema type: ${schemaType}
Title: ${title}
${description ? `Description: ${description}` : ""}
${url ? `URL: ${url}` : ""}
${extra ? `Additional context: ${extra}` : ""}

Requirements:
- Output valid JSON-LD wrapped in <script type="application/ld+json"> tags
- Follow schema.org standards exactly
- Include all required and recommended properties for the ${schemaType} type
- Use realistic placeholder values where specific data is not provided
- For FAQPage, generate 3 relevant example Q&A pairs based on the title
- For BreadcrumbList, generate a 3-level breadcrumb based on the title and URL

Return only the JSON-LD script block, no explanation.`;

      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });

      const schemaOutput = completion.choices[0]?.message?.content ?? "";
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      await AIJob.findByIdAndUpdate(job._id, {
        status: "done",
        outputData: { schema: schemaOutput, schemaType },
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
      });

      return NextResponse.json({ jobId: job._id, schema: schemaOutput, schemaType, tokensUsed });
    } catch (aiErr) {
      const errorMsg = aiErr instanceof Error ? aiErr.message : "AI generation failed";
      await AIJob.findByIdAndUpdate(job._id, { status: "failed", error: errorMsg, completedAt: new Date() });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[ai/generate/schema POST]", err);
    return NextResponse.json({ error: "Failed to generate schema" }, { status: 500 });
  }
}

