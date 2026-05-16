import mongoose, { Schema, Document, model, models } from "mongoose";

export type AIJobType = "draft" | "rewrite" | "seo" | "faq" | "summary" | "schema" | "gaps";
export type AIJobStatus = "queued" | "running" | "done" | "failed" | "approved" | "rejected";

export interface IAIJob extends Document {
  type: AIJobType;
  status: AIJobStatus;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  aiModel?: string;
  tokensUsed?: number;
  error?: string;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  completedAt?: Date;
}

const AIJobSchema = new Schema<IAIJob>(
  {
    type: { type: String, enum: ["draft", "rewrite", "seo", "faq", "summary", "schema", "gaps"], required: true },
    status: {
      type: String,
      enum: ["queued", "running", "done", "failed", "approved", "rejected"],
      default: "queued",
    },
    inputData: { type: Schema.Types.Mixed, default: {} },
    outputData: { type: Schema.Types.Mixed },
    aiModel: { type: String },
    tokensUsed: { type: Number },
    error: { type: String },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AIJob = models.AIJob || model<IAIJob>("AIJob", AIJobSchema);
