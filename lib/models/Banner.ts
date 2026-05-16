import mongoose, { Schema, Document, model, models } from "mongoose";

export const BANNER_POSITIONS = [
  "homepage",
  "news",
  "blogs",
  "article",
  "providers",
  "licenses",
  "events",
  "casinos",
  "partners",
  "sidebar",
  "navbar",
] as const;

export type BannerPosition = (typeof BANNER_POSITIONS)[number];

export interface IBanner extends Document {
  name: string;
  image?: mongoose.Types.ObjectId;
  targetUrl: string;
  position: BannerPosition;
  utmCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  geoTargets: string[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  createdAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    name: { type: String, required: true },
    image: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    targetUrl: { type: String, required: true },
    position: { type: String, enum: BANNER_POSITIONS, default: "sidebar" },
    utmCampaign: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    geoTargets: [{ type: String }],
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

if (process.env.NODE_ENV !== "production" && models.Banner) {
  delete (models as Record<string, unknown>).Banner;
}

export const Banner = models.Banner || model<IBanner>("Banner", BannerSchema);
