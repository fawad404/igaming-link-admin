import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IMediaAsset extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  folder?: string;
  altText?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    folder: { type: String },
    altText: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MediaAsset = models.MediaAsset || model<IMediaAsset>("MediaAsset", MediaAssetSchema);
