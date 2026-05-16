import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IPageSection {
  type: string;
  order: number;
  data: Record<string, unknown>;
}

export interface IPage extends Document {
  title: string;
  slug: string;
  content?: string;
  sections: IPageSection[];
  isVisible: boolean;
  seoSettings?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PageSectionSchema = new Schema<IPageSection>(
  {
    type: { type: String, required: true },
    order: { type: Number, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PageSchema = new Schema<IPage>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String },
    sections: [PageSectionSchema],
    isVisible: { type: Boolean, default: true },
    seoSettings: { type: Schema.Types.ObjectId, ref: "SeoSettings" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Page = models.Page || model<IPage>("Page", PageSchema);
