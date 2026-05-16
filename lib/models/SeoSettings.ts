import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISeoSettings extends Document {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  title?: string;
  metaDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  robots: "index" | "noindex";
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: mongoose.Types.ObjectId;
  focusKeywords: string[];
  schemaType?: string;
  schemaJson?: string;
  sitemapInclude: boolean;
  lastModified?: Date;
}

const SeoSettingsSchema = new Schema<ISeoSettings>({
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String },
  metaDescription: { type: String },
  slug: { type: String },
  canonicalUrl: { type: String },
  robots: { type: String, enum: ["index", "noindex"], default: "index" },
  ogTitle: { type: String },
  ogDescription: { type: String },
  ogImage: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
  focusKeywords: [{ type: String }],
  schemaType: { type: String },
  schemaJson: { type: String },
  sitemapInclude: { type: Boolean, default: true },
  lastModified: { type: Date },
});

export const SeoSettings = models.SeoSettings || model<ISeoSettings>("SeoSettings", SeoSettingsSchema);
