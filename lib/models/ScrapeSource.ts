import { Schema, Document, model, models } from "mongoose";

export interface IScrapeSource extends Document {
  name: string;
  url: string;
  crawlSchedule?: string;
  isActive: boolean;
  robotsRespected: boolean;
  lastCrawledAt?: Date;
  contentType?: string;
  extractionRules?: Record<string, unknown>;
  notes?: string;
  createdAt: Date;
}

const ScrapeSourceSchema = new Schema<IScrapeSource>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    crawlSchedule: { type: String },
    isActive: { type: Boolean, default: true },
    robotsRespected: { type: Boolean, default: true },
    lastCrawledAt: { type: Date },
    contentType: { type: String },
    extractionRules: { type: Schema.Types.Mixed },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ScrapeSource = models.ScrapeSource || model<IScrapeSource>("ScrapeSource", ScrapeSourceSchema);
