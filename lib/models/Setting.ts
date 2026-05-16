import { Schema, Document, model, models } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: string;
  label: string;
  group: "general" | "seo" | "ai" | "analytics" | "menus" | "security";
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: "" },
    label: { type: String, required: true },
    group: {
      type: String,
      enum: ["general", "seo", "ai", "analytics", "menus", "security"],
      required: true,
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Setting = models.Setting || model<ISetting>("Setting", SettingSchema);
