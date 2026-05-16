import mongoose, { Schema, Document, model, models } from "mongoose";

export type ArticleStatus = "imported" | "ai-draft" | "needs-review" | "approved" | "published" | "archived";

export interface IArticle extends Document {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  heroImage?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  author?: mongoose.Types.ObjectId;
  status: ArticleStatus;
  seoSettings?: mongoose.Types.ObjectId;
  isFeatured: boolean;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  revisions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String },
    content: { type: String, default: "" },
    heroImage: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    author: { type: Schema.Types.ObjectId, ref: "Author" },
    status: {
      type: String,
      enum: ["imported", "ai-draft", "needs-review", "approved", "published", "archived"],
      default: "ai-draft",
    },
    seoSettings: { type: Schema.Types.ObjectId, ref: "SeoSettings" },
    isFeatured: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    revisions: [{ type: Schema.Types.ObjectId, ref: "Revision" }],
  },
  { timestamps: true }
);

export const Article = models.Article || model<IArticle>("Article", ArticleSchema);
