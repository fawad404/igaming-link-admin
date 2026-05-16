import { Schema, Document, model, models } from "mongoose";

export interface IRedirect extends Document {
  fromPath: string;
  toPath: string;
  type: 301 | 302;
  isActive: boolean;
  hits: number;
  createdAt: Date;
}

const RedirectSchema = new Schema<IRedirect>(
  {
    fromPath: { type: String, required: true, unique: true },
    toPath: { type: String, required: true },
    type: { type: Number, enum: [301, 302], default: 301 },
    isActive: { type: Boolean, default: true },
    hits: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Redirect = models.Redirect || model<IRedirect>("Redirect", RedirectSchema);
