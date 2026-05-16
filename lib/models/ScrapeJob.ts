import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IScrapeJob extends Document {
  source: mongoose.Types.ObjectId;
  status: "pending" | "running" | "done" | "failed" | "approved" | "rejected";
  extractedContent?: string;
  sourceUrl?: string;
  duplicateCheckResult?: string;
  transformationStatus?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ScrapeJobSchema = new Schema<IScrapeJob>(
  {
    source: { type: Schema.Types.ObjectId, ref: "ScrapeSource", required: true },
    status: {
      type: String,
      enum: ["pending", "running", "done", "failed", "approved", "rejected"],
      default: "pending",
    },
    extractedContent: { type: String },
    sourceUrl: { type: String },
    duplicateCheckResult: { type: String },
    transformationStatus: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ScrapeJob = models.ScrapeJob || model<IScrapeJob>("ScrapeJob", ScrapeJobSchema);
