"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

type GenerationType = "draft" | "rewrite" | "seo" | "faq" | "summary" | "schema" | "gaps";

interface GenerateResult {
  jobId: string;
  type: GenerationType;
  data: Record<string, unknown>;
  tokensUsed: number;
}

interface Props {
  onResult: (result: GenerateResult) => void;
}

const TYPE_LABELS: Record<GenerationType, string> = {
  draft: "Article Draft",
  rewrite: "Rewrite Content",
  seo: "SEO Metadata",
  faq: "FAQ List",
  summary: "Summary / Excerpt",
  schema: "Schema / Structured Data",
  gaps: "Content Gap Suggestions",
};

const SCHEMA_TYPE_OPTIONS = [
  { value: "Article", label: "Article" },
  { value: "FAQPage", label: "FAQ Page" },
  { value: "BreadcrumbList", label: "Breadcrumb List" },
  { value: "Organization", label: "Organization" },
  { value: "WebSite", label: "WebSite" },
];

export function AiGeneratePanel({ onResult }: Props) {
  const [type, setType] = useState<GenerationType>("draft");
  const [loading, setLoading] = useState(false);

  // draft fields
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [outline, setOutline] = useState("");
  const [targetLength, setTargetLength] = useState("800");

  // rewrite fields
  const [rewriteContent, setRewriteContent] = useState("");
  const [rewriteInstructions, setRewriteInstructions] = useState("");

  // seo fields
  const [seoTitle, setSeoTitle] = useState("");
  const [seoContent, setSeoContent] = useState("");

  // faq fields
  const [faqTopic, setFaqTopic] = useState("");
  const [faqCount, setFaqCount] = useState("5");

  // summary fields
  const [summaryContent, setSummaryContent] = useState("");
  const [summaryMaxLength, setSummaryMaxLength] = useState("150");

  // schema fields
  const [schemaType, setSchemaType] = useState("Article");
  const [schemaTitle, setSchemaTitle] = useState("");
  const [schemaDescription, setSchemaDescription] = useState("");
  const [schemaUrl, setSchemaUrl] = useState("");
  const [schemaExtra, setSchemaExtra] = useState("");

  // gaps fields
  const [gapsNiche, setGapsNiche] = useState("");
  const [gapsExisting, setGapsExisting] = useState("");
  const [gapsCount, setGapsCount] = useState("10");

  async function handleSubmit() {
    setLoading(true);
    try {
      let endpoint = "";
      let body: Record<string, unknown> = {};

      if (type === "draft") {
        if (!topic.trim()) { toast.error("Topic is required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/draft";
        body = {
          topic: topic.trim(),
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
          outline: outline.trim() || undefined,
          targetLength: parseInt(targetLength) || 800,
        };
      } else if (type === "rewrite") {
        if (!rewriteContent.trim()) { toast.error("Content is required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/rewrite";
        body = { content: rewriteContent.trim(), instructions: rewriteInstructions.trim() || undefined };
      } else if (type === "seo") {
        if (!seoTitle.trim() || !seoContent.trim()) { toast.error("Title and content are required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/seo";
        body = { title: seoTitle.trim(), content: seoContent.trim() };
      } else if (type === "faq") {
        if (!faqTopic.trim()) { toast.error("Topic is required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/faq";
        body = { topic: faqTopic.trim(), count: parseInt(faqCount) || 5 };
      } else if (type === "summary") {
        if (!summaryContent.trim()) { toast.error("Content is required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/summary";
        body = { content: summaryContent.trim(), maxLength: parseInt(summaryMaxLength) || 150 };
      } else if (type === "schema") {
        if (!schemaTitle.trim()) { toast.error("Title is required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/schema";
        body = {
          schemaType,
          title: schemaTitle.trim(),
          description: schemaDescription.trim() || undefined,
          url: schemaUrl.trim() || undefined,
          extra: schemaExtra.trim() || undefined,
        };
      } else if (type === "gaps") {
        if (!gapsNiche.trim()) { toast.error("Niche/topic is required"); setLoading(false); return; }
        endpoint = "/api/ai/generate/gaps";
        body = {
          niche: gapsNiche.trim(),
          existingTopics: gapsExisting.split("\n").map(t => t.trim()).filter(Boolean),
          count: parseInt(gapsCount) || 10,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Generation failed"); return; }

      const { jobId, tokensUsed, ...rest } = data;
      onResult({ jobId, type, data: rest, tokensUsed });
      toast.success(`${TYPE_LABELS[type]} generated successfully`);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="w-64">
        <Select
          label="Generation Type"
          value={type}
          onChange={e => setType(e.target.value as GenerationType)}
          options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      {type === "draft" && (
        <div className="space-y-4">
          <Input label="Topic *" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Best crypto casinos for US players 2025" />
          <Input label="Target Keywords (comma-separated)" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. crypto casino, bitcoin gambling, US online casino" />
          <Textarea label="Outline (optional)" value={outline} onChange={e => setOutline(e.target.value)} placeholder="Paste your outline or leave blank for AI to decide" rows={4} />
          <div className="w-48">
            <Select
              label="Target Length (words)"
              value={targetLength}
              onChange={e => setTargetLength(e.target.value)}
              options={[
                { value: "400", label: "~400 words (short)" },
                { value: "800", label: "~800 words (medium)" },
                { value: "1500", label: "~1500 words (long)" },
                { value: "2500", label: "~2500 words (in-depth)" },
              ]}
            />
          </div>
        </div>
      )}

      {type === "rewrite" && (
        <div className="space-y-4">
          <Textarea label="Content to Rewrite *" value={rewriteContent} onChange={e => setRewriteContent(e.target.value)} placeholder="Paste the HTML or text content to rewrite" rows={10} />
          <Input label="Rewrite Instructions (optional)" value={rewriteInstructions} onChange={e => setRewriteInstructions(e.target.value)} placeholder="e.g. Make it more formal, add more detail about bonuses" />
        </div>
      )}

      {type === "seo" && (
        <div className="space-y-4">
          <Input label="Article Title *" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="e.g. Best Online Casinos in Canada 2025" />
          <Textarea label="Content / Summary *" value={seoContent} onChange={e => setSeoContent(e.target.value)} placeholder="Paste a short summary or the article intro" rows={5} />
        </div>
      )}

      {type === "faq" && (
        <div className="space-y-4">
          <Input label="Topic *" value={faqTopic} onChange={e => setFaqTopic(e.target.value)} placeholder="e.g. MGA Gaming License" />
          <div className="w-48">
            <Select
              label="Number of FAQs"
              value={faqCount}
              onChange={e => setFaqCount(e.target.value)}
              options={[
                { value: "3", label: "3 questions" },
                { value: "5", label: "5 questions" },
                { value: "8", label: "8 questions" },
                { value: "10", label: "10 questions" },
              ]}
            />
          </div>
        </div>
      )}

      {type === "summary" && (
        <div className="space-y-4">
          <Textarea label="Content to Summarize *" value={summaryContent} onChange={e => setSummaryContent(e.target.value)} placeholder="Paste the full article text or HTML" rows={8} />
          <div className="w-48">
            <Select
              label="Max Summary Length"
              value={summaryMaxLength}
              onChange={e => setSummaryMaxLength(e.target.value)}
              options={[
                { value: "100", label: "~100 chars" },
                { value: "150", label: "~150 chars (meta)" },
                { value: "250", label: "~250 chars" },
                { value: "500", label: "~500 chars" },
              ]}
            />
          </div>
        </div>
      )}

      {type === "schema" && (
        <div className="space-y-4">
          <div className="w-56">
            <Select
              label="Schema Type *"
              value={schemaType}
              onChange={e => setSchemaType(e.target.value)}
              options={SCHEMA_TYPE_OPTIONS}
            />
          </div>
          <Input label="Title / Name *" value={schemaTitle} onChange={e => setSchemaTitle(e.target.value)} placeholder="e.g. Best Online Casinos in Canada 2025" />
          <Textarea label="Description (optional)" value={schemaDescription} onChange={e => setSchemaDescription(e.target.value)} placeholder="Brief description of the page/content" rows={3} />
          <Input label="Page URL (optional)" value={schemaUrl} onChange={e => setSchemaUrl(e.target.value)} placeholder="https://igaminglink.com/..." />
          <Input label="Extra Context (optional)" value={schemaExtra} onChange={e => setSchemaExtra(e.target.value)} placeholder="e.g. author name, publisher, date published" />
        </div>
      )}

      {type === "gaps" && (
        <div className="space-y-4">
          <Input
            label="Niche / Focus Topic *"
            value={gapsNiche}
            onChange={e => setGapsNiche(e.target.value)}
            placeholder="e.g. online casino regulations, iGaming providers, crypto gambling"
          />
          <Textarea
            label="Already Covered Topics (one per line, optional)"
            value={gapsExisting}
            onChange={e => setGapsExisting(e.target.value)}
            placeholder={"Best online casinos in Canada\nMGA license explained\n..."}
            rows={5}
            helper="Leave blank to auto-detect from your published articles."
          />
          <div className="w-48">
            <Select
              label="Number of Suggestions"
              value={gapsCount}
              onChange={e => setGapsCount(e.target.value)}
              options={[
                { value: "5", label: "5 suggestions" },
                { value: "10", label: "10 suggestions" },
                { value: "15", label: "15 suggestions" },
                { value: "20", label: "20 suggestions" },
              ]}
            />
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Generating…" : `Generate ${TYPE_LABELS[type]}`}
      </Button>
    </div>
  );
}
