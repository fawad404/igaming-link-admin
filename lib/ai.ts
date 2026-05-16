import OpenAI from "openai";
import { connectDB } from "@/lib/mongodb";
import { Setting } from "@/lib/models/Setting";

export async function getOpenAIClient(): Promise<{ client: OpenAI; model: string }> {
  await connectDB();
  const [apiKeySetting, modelSetting] = await Promise.all([
    Setting.findOne({ key: "ai_api_key" }).lean(),
    Setting.findOne({ key: "ai_default_model" }).lean(),
  ]);

  const apiKey = apiKeySetting?.value;
  if (!apiKey) throw new Error("AI API key not configured. Set it in Settings → AI.");

  const model = modelSetting?.value || "gpt-4o";
  const client = new OpenAI({ apiKey });
  return { client, model };
}
