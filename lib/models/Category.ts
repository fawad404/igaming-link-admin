import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentCategory?: mongoose.Types.ObjectId;
  imageUrl?: string;
  type?: "news" | "blog";
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category" },
    imageUrl: { type: String },
    type: { type: String, enum: ["news", "blog"] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Category = models.Category || model<ICategory>("Category", CategorySchema);
