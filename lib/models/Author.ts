import { Schema, Document, model, models } from "mongoose";

export interface IAuthor extends Document {
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

const AuthorSchema = new Schema<IAuthor>(
  {
    name: { type: String, required: true },
    email: { type: String },
    bio: { type: String },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Author = models.Author || model<IAuthor>("Author", AuthorSchema);
