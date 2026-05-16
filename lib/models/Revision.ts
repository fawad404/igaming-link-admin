import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IRevision extends Document {
  article: mongoose.Types.ObjectId;
  content: string;
  changedBy: mongoose.Types.ObjectId;
  changeNote?: string;
  createdAt: Date;
}

const RevisionSchema = new Schema<IRevision>(
  {
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true },
    content: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changeNote: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Revision = models.Revision || model<IRevision>("Revision", RevisionSchema);
