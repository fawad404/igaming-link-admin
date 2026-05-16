import { Schema, Document, model, models } from "mongoose";

export interface ITag extends Document {
  name: string;
  slug: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Tag = models.Tag || model<ITag>("Tag", TagSchema);
