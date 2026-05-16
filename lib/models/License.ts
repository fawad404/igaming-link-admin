import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IFAQ {
  question: string;
  answer: string;
}

export interface ILicense extends Document {
  name: string;
  slug: string;
  jurisdiction?: string;
  description?: string;
  requirements?: string;
  complianceNotes?: string;
  fees?: string;
  licenceTypes?: string[];
  processingTime?: string;
  bestFor?: string;
  faqs: IFAQ[];
  isActive: boolean;
  seoSettings?: mongoose.Types.ObjectId;
  relatedArticles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  { question: { type: String, required: true }, answer: { type: String, required: true } },
  { _id: false }
);

const LicenseSchema = new Schema<ILicense>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    jurisdiction: { type: String },
    description: { type: String },
    requirements: { type: String },
    complianceNotes: { type: String },
    fees: { type: String },
    licenceTypes: [{ type: String }],
    processingTime: { type: String },
    bestFor: { type: String },
    faqs: [FAQSchema],
    isActive: { type: Boolean, default: true },
    seoSettings: { type: Schema.Types.ObjectId, ref: "SeoSettings" },
    relatedArticles: [{ type: Schema.Types.ObjectId, ref: "Article" }],
  },
  { timestamps: true }
);

export const License = models.License || model<ILicense>("License", LicenseSchema);
