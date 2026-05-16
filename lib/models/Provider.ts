import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IGame {
  name: string;
  type: string;
}

export interface IProvider extends Document {
  name: string;
  slug: string;
  logo?: mongoose.Types.ObjectId;
  description?: string;
  website?: string;
  tags: string[];
  games: IGame[];
  regions: string[];
  isActive: boolean;
  seoSettings?: mongoose.Types.ObjectId;
  relatedArticles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  { name: { type: String, required: true }, type: { type: String, required: true } },
  { _id: false }
);

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    description: { type: String },
    website: { type: String },
    tags: [{ type: String }],
    games: [GameSchema],
    regions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    seoSettings: { type: Schema.Types.ObjectId, ref: "SeoSettings" },
    relatedArticles: [{ type: Schema.Types.ObjectId, ref: "Article" }],
  },
  { timestamps: true }
);

export const Provider = models.Provider || model<IProvider>("Provider", ProviderSchema);
